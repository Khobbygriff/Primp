package com.primp.user_service.controller;

import com.primp.user_service.dto.UserResponse;
import com.primp.user_service.dto.WebhookProcessRequest;
import com.primp.user_service.service.PremiumPaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/webhooks")
public class UserWebhookController {

    private final PremiumPaymentService premiumPaymentService;

    public UserWebhookController(PremiumPaymentService premiumPaymentService) {
        this.premiumPaymentService = premiumPaymentService;
    }

    @PostMapping("/paystack/process")
    public ResponseEntity<UserResponse> processPaystackWebhook(@RequestBody WebhookProcessRequest request) {
        return ResponseEntity.ok(premiumPaymentService.processWebhookPayment(request.getReference()));
    }
}