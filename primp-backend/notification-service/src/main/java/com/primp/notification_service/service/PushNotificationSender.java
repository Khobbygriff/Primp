package com.primp.notification_service.service;

import com.primp.notification_service.model.DeviceToken;
import com.primp.notification_service.repository.DeviceTokenRepository;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Delivers push notifications for the app's Expo-managed Android build.
 * Expo's push service (exp.host) forwards Android deliveries through
 * Firebase Cloud Messaging on our behalf, so no native FCM service-account
 * credential is required in this repo — this is the correct integration
 * point for "Notifications via FCM" given the project is Expo-managed.
 *
 * Failures here are swallowed so that in-app/database notifications
 * (the source of truth) are never blocked by a push delivery problem,
 * matching the existing fire-and-forget pattern used by NotificationClient
 * in the booking service.
 */
@Component
public class PushNotificationSender {

    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

    private final RestTemplate restTemplate;
    private final DeviceTokenRepository deviceTokenRepository;

    public PushNotificationSender(DeviceTokenRepository deviceTokenRepository) {
        this.restTemplate = new RestTemplate();
        this.deviceTokenRepository = deviceTokenRepository;
    }

    public void sendToUser(Long userId, String title, String body, Long relatedBookingId) {
        List<DeviceToken> tokens = deviceTokenRepository.findByUserId(userId);
        if (tokens.isEmpty()) {
            return;
        }

        List<Map<String, Object>> messages = new ArrayList<>();
        for (DeviceToken token : tokens) {
            Map<String, Object> message = new HashMap<>();
            message.put("to", token.getPushToken());
            message.put("title", title);
            message.put("body", body);
            message.put("sound", "default");
            Map<String, Object> data = new HashMap<>();
            data.put("relatedBookingId", relatedBookingId);
            message.put("data", data);
            messages.add(message);
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Accept", "application/json");
            HttpEntity<List<Map<String, Object>>> entity = new HttpEntity<>(messages, headers);
            restTemplate.postForEntity(EXPO_PUSH_URL, entity, String.class);
        } catch (Exception e) {
            System.err.println("Failed to dispatch push notification for user " + userId + ": " + e.getMessage());
        }
    }
}