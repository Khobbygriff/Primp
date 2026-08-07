package com.primp.user_service.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@Component
public class PaystackClient {

    private static final String BASE_URL = "https://api.paystack.co";

    private final RestTemplate restTemplate;

    @Value("${paystack.secret-key}")
    private String secretKey;

    public PaystackClient() {
        this.restTemplate = new RestTemplate();
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> initializeTransaction(String email, long amountInSubunit, String reference,
                                                     String currency, Map<String, Object> metadata) {
        Map<String, Object> body = Map.of(
                "email", email,
                "amount", amountInSubunit,
                "reference", reference,
                "currency", currency,
                "metadata", metadata
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, authHeaders());

        Map<String, Object> response = restTemplate.postForObject(
                BASE_URL + "/transaction/initialize", entity, Map.class);

        if (response == null || !Boolean.TRUE.equals(response.get("status"))) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to initialize payment with Paystack");
        }
        return (Map<String, Object>) response.get("data");
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> verifyTransaction(String reference) {
        HttpEntity<Void> entity = new HttpEntity<>(authHeaders());

        ResponseEntity<Map> response = restTemplate.exchange(
                BASE_URL + "/transaction/verify/" + reference,
                HttpMethod.GET,
                entity,
                Map.class
        );

        Map<String, Object> body = response.getBody();
        if (body == null || !Boolean.TRUE.equals(body.get("status"))) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to verify payment with Paystack");
        }
        return (Map<String, Object>) body.get("data");
    }

    private HttpHeaders authHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(secretKey);
        return headers;
    }
}