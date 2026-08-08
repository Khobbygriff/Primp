package com.primp.user_service.service;

import com.primp.user_service.client.PaystackClient;
import com.primp.user_service.dto.PageResponse;
import com.primp.user_service.dto.PremiumPurchaseResponse;
import com.primp.user_service.dto.PremiumReconciliationResponse;
import com.primp.user_service.model.PremiumPurchase;
import com.primp.user_service.repository.PremiumPurchaseRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminPremiumPurchaseService {

    private final PremiumPurchaseRepository premiumPurchaseRepository;
    private final PaystackClient paystackClient;

    public AdminPremiumPurchaseService(PremiumPurchaseRepository premiumPurchaseRepository,
                                       PaystackClient paystackClient) {
        this.premiumPurchaseRepository = premiumPurchaseRepository;
        this.paystackClient = paystackClient;
    }

    public PageResponse<PremiumPurchaseResponse> listPurchases(String search, String feature,
                                                               int page, int pageSize) {
        Pageable pageable = PageRequest.of(Math.max(page - 1, 0), pageSize,
                Sort.by(Sort.Direction.DESC, "purchasedAt"));

        Page<PremiumPurchase> result = premiumPurchaseRepository.search(
                (search == null || search.isBlank()) ? null : search.trim(),
                (feature == null || feature.isBlank()) ? null : feature.toUpperCase(),
                pageable);

        List<PremiumPurchaseResponse> items = result.getContent().stream()
                .map(PremiumPurchaseResponse::new)
                .collect(Collectors.toList());

        return new PageResponse<>(items, page, pageSize, result.getTotalElements(), result.getTotalPages());
    }

    /**
     * Re-calls Paystack's own verify endpoint (same call PremiumPaymentService
     * made once at purchase time — see PaystackClient#verifyTransaction) and
     * diffs the live result against what's stored locally, rather than
     * trusting the one-time check made at purchase time forever.
     */
    public PremiumReconciliationResponse reconcilePurchase(Long purchaseId) {
        PremiumPurchase purchase = premiumPurchaseRepository.findById(purchaseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Purchase not found"));

        Map<String, Object> data = paystackClient.verifyTransaction(purchase.getPaymentReference());
        String status = (String) data.get("status");
        Long amountSubunit = asLong(data.get("amount"));
        Double paystackAmount = amountSubunit != null ? amountSubunit / 100.0 : null;

        boolean matches = "success".equals(status)
                && purchase.getAmount() != null
                && paystackAmount != null
                && Math.abs(purchase.getAmount() - paystackAmount) < 0.01;

        PremiumReconciliationResponse response = new PremiumReconciliationResponse();
        response.setPurchaseId(purchase.getId());
        response.setPaymentReference(purchase.getPaymentReference());
        response.setPaystackStatus(status);
        response.setPaystackAmount(paystackAmount);
        response.setMatchesLocalRecord(matches);
        response.setCheckedAt(LocalDateTime.now());
        return response;
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