package com.primp.user_service.service;

import com.primp.user_service.client.PaystackClient;
import com.primp.user_service.dto.PremiumPaymentInitializeRequest;
import com.primp.user_service.dto.PremiumPaymentInitializeResponse;
import com.primp.user_service.dto.PremiumPaymentVerifyRequest;
import com.primp.user_service.dto.UserResponse;
import com.primp.user_service.model.PremiumPurchase;
import com.primp.user_service.model.User;
import com.primp.user_service.repository.PremiumPurchaseRepository;
import com.primp.user_service.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Gates every premium feature behind a verified Paystack charge, matching
 * mixed billing model: Extended Portfolio and Verified Badge are
 * one-time unlocks; Priority Listing, Client Loyalty Tools, and Earnings
 * Analytics are subscriptions that expire and must be manually renewed
 * (no auto-charge / no stored card reuse in this MVP).
 */
@Service
public class PremiumPaymentService {

    private static final String CURRENCY = "GHS";

    private static final Set<String> SUBSCRIPTION_FEATURES =
            Set.of("PRIORITY_LISTING", "CLIENT_LOYALTY_TOOLS", "EARNINGS_ANALYTICS");

    // feature -> duration -> price (GHS). One-time features use the "ONE_TIME" key.
    private static final Map<String, Map<String, Double>> FEATURE_PRICING = Map.of(
            "PRIORITY_LISTING", Map.of("WEEKLY", 15.00, "MONTHLY", 50.00),
            "CLIENT_LOYALTY_TOOLS", Map.of("MONTHLY", 25.00),
            "EARNINGS_ANALYTICS", Map.of("MONTHLY", 20.00),
            "EXTENDED_PORTFOLIO", Map.of("ONE_TIME", 30.00),
            "VERIFIED_BADGE", Map.of("ONE_TIME", 40.00)
    );

    private final PaystackClient paystackClient;
    private final PremiumPurchaseRepository premiumPurchaseRepository;
    private final UserRepository userRepository;
    private final UserService userService;

    @Value("${paystack.public-key}")
    private String publicKey;

    public PremiumPaymentService(PaystackClient paystackClient,
                                 PremiumPurchaseRepository premiumPurchaseRepository,
                                 UserRepository userRepository,
                                 UserService userService) {
        this.paystackClient = paystackClient;
        this.premiumPurchaseRepository = premiumPurchaseRepository;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    public PremiumPaymentInitializeResponse initialize(Long userId, PremiumPaymentInitializeRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getRole() != User.Role.PROFESSIONAL) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only professional accounts can purchase premium features");
        }

        String feature = normalizeFeature(request.getFeature());
        String duration = resolveDuration(feature, request.getDuration());

        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "An email address is required to pay with Paystack");
        }

        double price = FEATURE_PRICING.get(feature).get(duration);
        long amountInSubunit = Math.round(price * 100);
        String reference = "PRIMP-PREM-" + UUID.randomUUID();

        Map<String, Object> metadata = Map.of(
                "userId", userId,
                "feature", feature,
                "duration", duration
        );

        Map<String, Object> data = paystackClient.initializeTransaction(
                request.getEmail(), amountInSubunit, reference, CURRENCY, metadata);

        return new PremiumPaymentInitializeResponse(
                reference,
                (String) data.get("access_code"),
                (String) data.get("authorization_url"),
                publicKey,
                amountInSubunit,
                CURRENCY,
                request.getEmail(),
                feature,
                duration
        );
    }

    @SuppressWarnings("unchecked")
    public UserResponse verify(Long authenticatedUserId, PremiumPaymentVerifyRequest request) {
        if (request.getReference() == null || request.getReference().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A payment reference is required");
        }

        PremiumPurchase existing = premiumPurchaseRepository.findByPaymentReference(request.getReference()).orElse(null);
        if (existing != null) {
            return userService.getProfile(authenticatedUserId);
        }

        Map<String, Object> data = paystackClient.verifyTransaction(request.getReference());

        String status = (String) data.get("status");
        if (!"success".equals(status)) {
            throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED,
                    "Payment was not successful (status: " + status + ")");
        }

        Map<String, Object> metadata = (Map<String, Object>) data.get("metadata");
        if (metadata == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Payment record is missing purchase metadata");
        }

        Long verifiedUserId = asLong(metadata.get("userId"));
        if (verifiedUserId == null || !verifiedUserId.equals(authenticatedUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This payment does not belong to you");
        }

        String feature = (String) metadata.get("feature");
        String duration = (String) metadata.get("duration");
        if (feature == null || duration == null
                || !FEATURE_PRICING.containsKey(feature)
                || !FEATURE_PRICING.get(feature).containsKey(duration)) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Payment record has an unknown feature or duration");
        }

        double expectedPrice = FEATURE_PRICING.get(feature).get(duration);
        Long verifiedAmount = asLong(data.get("amount"));
        long expectedAmount = Math.round(expectedPrice * 100);
        if (verifiedAmount == null || verifiedAmount != expectedAmount) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Paid amount does not match the feature price");
        }

        UserResponse updated = userService.applyPremiumPurchase(authenticatedUserId, feature, duration);

        PremiumPurchase purchase = new PremiumPurchase();
        purchase.setUserId(authenticatedUserId);
        purchase.setFeature(feature);
        purchase.setDuration(duration);
        purchase.setPaymentReference(request.getReference());
        premiumPurchaseRepository.save(purchase);

        return updated;
    }

    private String normalizeFeature(String feature) {
        if (feature == null || !FEATURE_PRICING.containsKey(feature.toUpperCase())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown premium feature: " + feature);
        }
        return feature.toUpperCase();
    }

    private String resolveDuration(String feature, String requestedDuration) {
        if (!SUBSCRIPTION_FEATURES.contains(feature)) {
            return "ONE_TIME";
        }
        Map<String, Double> options = FEATURE_PRICING.get(feature);
        // CLIENT_LOYALTY_TOOLS / EARNINGS_ANALYTICS only ever offer MONTHLY;
        // PRIORITY_LISTING offers WEEKLY or MONTHLY and defaults to MONTHLY.
        if (requestedDuration != null && options.containsKey(requestedDuration.toUpperCase())) {
            return requestedDuration.toUpperCase();
        }
        if (options.containsKey("MONTHLY")) return "MONTHLY";
        return options.keySet().iterator().next();
    }

    private Long asLong(Object value) {
        if (value == null) return null;
        if (value instanceof Number) return ((Number) value).longValue();
        try {
            return Long.parseLong(value.toString().trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}