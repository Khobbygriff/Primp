package com.primp.user_service.controller;

import com.primp.user_service.dto.PageResponse;
import com.primp.user_service.dto.PremiumPurchaseResponse;
import com.primp.user_service.dto.PremiumReconciliationResponse;
import com.primp.user_service.service.AdminPremiumPurchaseService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin/premium-purchases")
public class AdminPremiumPurchaseController {

    private final AdminPremiumPurchaseService adminPremiumPurchaseService;

    public AdminPremiumPurchaseController(AdminPremiumPurchaseService adminPremiumPurchaseService) {
        this.adminPremiumPurchaseService = adminPremiumPurchaseService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<PremiumPurchaseResponse>> list(
            @RequestHeader(value = "X-User-Role", required = false) String callerRole,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String feature) {
        requireAdmin(callerRole);
        return ResponseEntity.ok(adminPremiumPurchaseService.listPurchases(search, feature, page, pageSize));
    }

    @PostMapping("/{purchaseId}/reconcile")
    public ResponseEntity<PremiumReconciliationResponse> reconcile(
            @RequestHeader(value = "X-User-Role", required = false) String callerRole,
            @PathVariable Long purchaseId) {
        requireAdmin(callerRole);
        return ResponseEntity.ok(adminPremiumPurchaseService.reconcilePurchase(purchaseId));
    }

    private void requireAdmin(String callerRole) {
        if (!"ADMIN".equals(callerRole)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }
    }
}