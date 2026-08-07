package com.primp.booking_service.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.HashMap;
import java.util.Map;

@Component
public class NotificationClient {

    private final RestTemplate restTemplate;

    @Value("${notification.service.url}")
    private String notificationServiceUrl;

    @Value("${internal.service.secret}")
    private String internalServiceSecret;

    public NotificationClient() {
        this.restTemplate = new RestTemplate();
    }

    public void sendNotification(Long userId, String type, String title, String body, Long relatedBookingId) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("userId", userId);
            request.put("type", type);
            request.put("title", title);
            request.put("body", body);
            request.put("relatedBookingId", relatedBookingId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            // This call bypasses the gateway (the gateway deliberately 404s
            // /api/notifications/internal to keep it non-public), so it must
            // carry the internal secret itself to pass notification-service's
            // InternalServiceFilter.
            headers.set("X-Internal-Secret", internalServiceSecret);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            restTemplate.postForEntity(
                    notificationServiceUrl + "/api/notifications/internal",
                    entity,
                    String.class
            );
        } catch (Exception e) {
            // Don't fail the booking operation if notification fails
            System.err.println("Failed to send notification: " + e.getMessage());
        }
    }
}