package com.primp.gateway.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.primp.gateway.security.PaystackSignatureVerifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Single public entry point for Paystack's server-to-server webhook.
 * Closes the "abandoned payment" blind spot: today, a booking or
 * premium-feature charge that succeeds on Paystack's side but never gets
 * a client-initiated POST .../verify call (app crash, closed tab, lost
 * connection right after payment) leaves NO record in either service —
 * PaymentService#verify / PremiumPaymentService#verify are the only code
 * paths that ever create a Booking/PremiumPurchase row. This is the
 * second, independent path that catches that case.
 *
 * Trust model: the HMAC-SHA512 signature (see PaystackSignatureVerifier)
 * is the ONLY thing that makes this endpoint trustworthy — it's public by
 * necessity, so GatewayController explicitly 404s any attempt to reach
 * the downstream processing endpoints through the normal forwarding
 * routes (same pattern already used for /api/notifications/internal).
 */
@RestController
public class PaystackWebhookController {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final PaystackSignatureVerifier signatureVerifier;

    @Value("${paystack.secret-key}")
    private String paystackSecretKey;

    @Value("${booking.service.url}")
    private String bookingServiceUrl;

    @Value("${user.service.url}")
    private String userServiceUrl;

    @Value("${internal.service.secret}")
    private String internalServiceSecret;

    public PaystackWebhookController(PaystackSignatureVerifier signatureVerifier) {
        this.signatureVerifier = signatureVerifier;
    }

    @PostMapping(value = "/api/webhooks/paystack", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> handleWebhook(
            @RequestHeader(value = "X-Paystack-Signature", required = false) String signature,
            @RequestBody String rawBody) {

        if (!signatureVerifier.isValid(rawBody, signature, paystackSecretKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid signature");
        }

        JsonNode root;
        try {
            root = objectMapper.readTree(rawBody);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Malformed payload");
        }

        String event = root.path("event").asText("");
        if (!"charge.success".equals(event)) {
            return ResponseEntity.ok("Ignored: " + event);
        }

        JsonNode data = root.path("data");
        String reference = data.path("reference").asText(null);
        JsonNode metadata = data.path("metadata");

        if (reference == null) {
            return ResponseEntity.badRequest().body("Missing reference");
        }

        String targetServiceUrl = routeByMetadataShape(metadata);
        if (targetServiceUrl == null) {
            System.err.println("[PaystackWebhookController] Could not route reference " + reference
                    + " — unrecognized metadata shape.");
            return ResponseEntity.ok("Acknowledged (unroutable)");
        }

        String processingPath = targetServiceUrl.equals(bookingServiceUrl)
                ? "/api/bookings/webhooks/paystack/process"
                : "/api/auth/webhooks/paystack/process";

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Internal-Secret", internalServiceSecret);

            Map<String, Object> body = new HashMap<>();
            body.put("reference", reference);

            restTemplate.postForEntity(targetServiceUrl + processingPath, new HttpEntity<>(body, headers), String.class);
        } catch (Exception e) {
            // Non-2xx / unreachable: return 500 so Paystack retries with backoff.
            System.err.println("[PaystackWebhookController] Failed to process reference " + reference + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Processing failed");
        }

        return ResponseEntity.ok("Processed");
    }

    /**
     * Booking payments carry professionalId/serviceType in metadata (see
     * PaymentService#initialize); premium payments carry feature/duration
     * (see PremiumPaymentService#initialize). The shapes never overlap.
     */
    private String routeByMetadataShape(JsonNode metadata) {
        if (metadata == null || metadata.isMissingNode()) return null;
        if (metadata.has("feature")) return userServiceUrl;
        if (metadata.has("professionalId") && metadata.has("serviceType")) return bookingServiceUrl;
        return null;
    }
}