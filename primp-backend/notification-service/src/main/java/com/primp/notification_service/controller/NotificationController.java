package com.primp.notification_service.controller;

import com.primp.notification_service.dto.DeviceTokenRequest;
import com.primp.notification_service.dto.NotificationRequest;
import com.primp.notification_service.dto.NotificationResponse;
import com.primp.notification_service.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping("/internal")
    public ResponseEntity<NotificationResponse> createNotification(
            @RequestBody NotificationRequest request) {
        return ResponseEntity.ok(notificationService.createNotification(request));
    }

    @PostMapping("/device-token")
    public ResponseEntity<Void> registerDeviceToken(
            @RequestHeader("X-User-Id") Long authenticatedUserId,
            @RequestBody DeviceTokenRequest request) {
        notificationService.registerDeviceToken(authenticatedUserId, request.getToken());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<NotificationResponse>> getUserNotifications(
            @RequestHeader("X-User-Id") Long authenticatedUserId,
            @PathVariable Long userId) {
        if (!authenticatedUserId.equals(userId)) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "Unauthorized");
        }
        return ResponseEntity.ok(notificationService.getUserNotifications(userId));
    }

    @GetMapping("/user/{userId}/unread")
    public ResponseEntity<List<NotificationResponse>> getUnreadNotifications(
            @RequestHeader("X-User-Id") Long authenticatedUserId,
            @PathVariable Long userId) {
        if (!authenticatedUserId.equals(userId)) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "Unauthorized");
        }
        return ResponseEntity.ok(notificationService.getUnreadNotifications(userId));
    }

    @GetMapping("/user/{userId}/count")
    public ResponseEntity<Long> getUnreadCount(
            @RequestHeader("X-User-Id") Long authenticatedUserId,
            @PathVariable Long userId) {
        if (!authenticatedUserId.equals(userId)) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "Unauthorized");
        }
        return ResponseEntity.ok(notificationService.getUnreadCount(userId));
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<NotificationResponse> markAsRead(
            @RequestHeader("X-User-Id") Long authenticatedUserId,
            @PathVariable Long notificationId) {
        return ResponseEntity.ok(notificationService.markAsRead(notificationId, authenticatedUserId));
    }

    @PutMapping("/user/{userId}/read-all")
    public ResponseEntity<Void> markAllAsRead(
            @RequestHeader("X-User-Id") Long authenticatedUserId,
            @PathVariable Long userId) {
        if (!authenticatedUserId.equals(userId)) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "Unauthorized");
        }
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok().build();
    }
}