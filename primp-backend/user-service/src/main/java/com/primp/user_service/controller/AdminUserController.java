package com.primp.user_service.controller;

import com.primp.user_service.dto.AdminUserResponse;
import com.primp.user_service.dto.PageResponse;
import com.primp.user_service.dto.SuspendUserRequest;
import com.primp.user_service.dto.AdminUserStatsResponse;
import com.primp.user_service.service.AdminUserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<AdminUserResponse>> listUsers(
            @RequestHeader(value = "X-User-Role", required = false) String callerRole,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "true") boolean includeSuspended) {
        requireAdmin(callerRole);
        return ResponseEntity.ok(adminUserService.listUsers(search, role, includeSuspended, page, pageSize));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<AdminUserResponse> getUser(
            @RequestHeader(value = "X-User-Role", required = false) String callerRole,
            @PathVariable Long userId) {
        requireAdmin(callerRole);
        return ResponseEntity.ok(adminUserService.getUserDetail(userId));
    }

    @PostMapping("/{userId}/suspend")
    public ResponseEntity<AdminUserResponse> suspend(
            @RequestHeader(value = "X-User-Role", required = false) String callerRole,
            @PathVariable Long userId,
            @RequestBody SuspendUserRequest request) {
        requireAdmin(callerRole);
        return ResponseEntity.ok(adminUserService.suspendUser(userId, request.getReason()));
    }

    @PostMapping("/{userId}/reinstate")
    public ResponseEntity<AdminUserResponse> reinstate(
            @RequestHeader(value = "X-User-Role", required = false) String callerRole,
            @PathVariable Long userId) {
        requireAdmin(callerRole);
        return ResponseEntity.ok(adminUserService.reinstateUser(userId));
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminUserStatsResponse> getStats(
            @RequestHeader(value = "X-User-Role", required = false) String callerRole) {
        requireAdmin(callerRole);
        return ResponseEntity.ok(adminUserService.getStats());
    }

    /**
     * Defense in depth: the gateway already blocks non-admins from
     * reaching this route (see GatewayController#requireAdmin), but this
     * service re-checks independently rather than trusting that upstream
     * gate alone — same principle InternalServiceFilter already applies
     * one layer down.
     */
    private void requireAdmin(String callerRole) {
        if (!"ADMIN".equals(callerRole)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }
    }
}