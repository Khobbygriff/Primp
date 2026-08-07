package com.primp.booking_service.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
public class UserClient {

    private final RestTemplate restTemplate;

    @Value("${user.service.url}")
    private String userServiceUrl;

    @Value("${internal.service.secret}")
    private String internalServiceSecret;

    public UserClient() {
        this.restTemplate = new RestTemplate();
    }

    public String getUserName(Long userId) {
        Map<String, Object> profile = fetchProfile(userId);
        if (profile != null && profile.get("name") != null) {
            return profile.get("name").toString();
        }
        return "Primp User #" + userId;
    }

    public boolean hasClientLoyaltyTools(Long professionalId) {
        return isFlagTrue(professionalId, "hasClientLoyaltyTools");
    }

    public boolean hasEarningsAnalytics(Long professionalId) {
        return isFlagTrue(professionalId, "hasEarningsAnalytics");
    }

    private boolean isFlagTrue(Long userId, String field) {
        Map<String, Object> profile = fetchProfile(userId);
        if (profile == null) return false;
        return Boolean.TRUE.equals(profile.get(field));
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> fetchProfile(Long userId) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Internal-Secret", internalServiceSecret);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            return restTemplate.exchange(
                    userServiceUrl + "/api/auth/profile/" + userId,
                    HttpMethod.GET,
                    entity,
                    Map.class
            ).getBody();
        } catch (Exception e) {
            System.err.println("Failed to fetch user profile, userId=" + userId + ": " + e.getMessage());
            return null;
        }
    }
}