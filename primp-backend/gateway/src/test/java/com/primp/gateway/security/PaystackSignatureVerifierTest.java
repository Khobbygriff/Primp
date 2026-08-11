package com.primp.gateway.security;

import org.junit.jupiter.api.Test;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PaystackSignatureVerifierTest {

    private final PaystackSignatureVerifier verifier = new PaystackSignatureVerifier();

    private String computeSignature(String secret, String body) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA512");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
        byte[] hash = mac.doFinal(body.getBytes(StandardCharsets.UTF_8));
        StringBuilder hex = new StringBuilder();
        for (byte b : hash) hex.append(String.format("%02x", b));
        return hex.toString();
    }

    @Test
    void acceptsACorrectlyComputedSignature() throws Exception {
        String secret = "test_secret_key";
        String body = "{\"event\":\"charge.success\",\"data\":{\"reference\":\"abc123\"}}";
        assertTrue(verifier.isValid(body, computeSignature(secret, body), secret));
    }

    @Test
    void rejectsATamperedBody() throws Exception {
        String secret = "test_secret_key";
        String originalBody = "{\"event\":\"charge.success\",\"data\":{\"reference\":\"abc123\"}}";
        String tamperedBody = "{\"event\":\"charge.success\",\"data\":{\"reference\":\"attacker-ref\"}}";
        assertFalse(verifier.isValid(tamperedBody, computeSignature(secret, originalBody), secret));
    }

    @Test
    void rejectsAMissingSignature() {
        assertFalse(verifier.isValid("{}", null, "secret"));
    }

    @Test
    void rejectsAWrongSecret() throws Exception {
        String body = "{\"event\":\"charge.success\"}";
        String signedWithDifferentSecret = computeSignature("wrong_secret", body);
        assertFalse(verifier.isValid(body, signedWithDifferentSecret, "test_secret_key"));
    }
}