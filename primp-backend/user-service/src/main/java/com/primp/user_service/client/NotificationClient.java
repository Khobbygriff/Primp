package com.primp.user_service.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import java.util.HashMap;
import java.util.Map;

@Component
public class NotificationClient {
    private final RestTemplate restTemplate;

    @Value("${notification.service.url}")
    private String notificationServiceUrl;

    @Value("${internal.service.secret}")
    private String internalServiceSecret;

    public NotificationClient() { this.restTemplate = new RestTemplate(); }

    public void sendNotification(Long userId, String type, String title, String body) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("userId", userId);
            request.put("type", type);
            request.put("title", title);
            request.put("body", body);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Internal-Secret", internalServiceSecret);

            restTemplate.postForEntity(
                    notificationServiceUrl + "/api/notifications/internal",
                    new HttpEntity<>(request, headers), String.class);
        } catch (Exception e) {
            System.err.println("Failed to send notification: " + e.getMessage());
        }
    }
}