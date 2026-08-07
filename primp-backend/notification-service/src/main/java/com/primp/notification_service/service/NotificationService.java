package com.primp.notification_service.service;

import com.primp.notification_service.dto.NotificationRequest;
import com.primp.notification_service.dto.NotificationResponse;
import com.primp.notification_service.model.DeviceToken;
import com.primp.notification_service.model.Notification;
import com.primp.notification_service.repository.DeviceTokenRepository;
import com.primp.notification_service.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final DeviceTokenRepository deviceTokenRepository;
    private final PushNotificationSender pushNotificationSender;

    public NotificationService(NotificationRepository notificationRepository,
                               DeviceTokenRepository deviceTokenRepository,
                               PushNotificationSender pushNotificationSender) {
        this.notificationRepository = notificationRepository;
        this.deviceTokenRepository = deviceTokenRepository;
        this.pushNotificationSender = pushNotificationSender;
    }

    public NotificationResponse createNotification(NotificationRequest request) {
        Notification notification = new Notification();
        notification.setUserId(request.getUserId());
        notification.setType(Notification.NotificationType.valueOf(
                request.getType().toUpperCase()));
        notification.setTitle(request.getTitle());
        notification.setBody(request.getBody());
        notification.setRelatedBookingId(request.getRelatedBookingId());
        Notification saved = notificationRepository.save(notification);

        // Push delivery is best-effort — the in-app notification above is the
        // source of truth and must succeed regardless of push outcome.
        pushNotificationSender.sendToUser(
                saved.getUserId(),
                saved.getTitle(),
                saved.getBody(),
                saved.getRelatedBookingId()
        );

        return new NotificationResponse(saved);
    }

    public List<NotificationResponse> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationResponse::new)
                .collect(Collectors.toList());
    }

    public List<NotificationResponse> getUnreadNotifications(Long userId) {
        return notificationRepository
                .findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationResponse::new)
                .collect(Collectors.toList());
    }

    public Long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    public NotificationResponse markAsRead(Long notificationId, Long authenticatedUserId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        if (!notification.getUserId().equals(authenticatedUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized");
        }
        notification.setIsRead(true);
        return new NotificationResponse(notificationRepository.save(notification));
    }

    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository
                .findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        unread.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(unread);
    }

    public void registerDeviceToken(Long userId, String token) {
        if (token == null || token.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Push token is required");
        }

        DeviceToken deviceToken = deviceTokenRepository.findByUserIdAndPushToken(userId, token)
                .orElseGet(() -> {
                    DeviceToken fresh = new DeviceToken();
                    fresh.setUserId(userId);
                    fresh.setPushToken(token);
                    return fresh;
                });
        deviceToken.setLastUsedAt(LocalDateTime.now());
        deviceTokenRepository.save(deviceToken);
    }
}