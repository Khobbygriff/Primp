package com.primp.booking_service.controller;

import com.primp.booking_service.dto.BookingResponse;
import com.primp.booking_service.dto.WebhookProcessRequest;
import com.primp.booking_service.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Internal-only — reachable exclusively via the gateway's
 * PaystackWebhookController (HMAC-verified before forwarding), and
 * explicitly 404'd by GatewayController if hit through the public
 * forwarding routes. InternalServiceFilter still enforces this too.
 */
@RestController
@RequestMapping("/api/bookings/webhooks")
public class BookingWebhookController {

    private final PaymentService paymentService;

    public BookingWebhookController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/paystack/process")
    public ResponseEntity<BookingResponse> processPaystackWebhook(@RequestBody WebhookProcessRequest request) {
        return ResponseEntity.ok(paymentService.processWebhookPayment(request.getReference()));
    }
}