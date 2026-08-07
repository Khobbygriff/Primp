package com.primp.booking_service.controller;

import com.primp.booking_service.dto.BookingResponse;
import com.primp.booking_service.dto.PaymentInitializeRequest;
import com.primp.booking_service.dto.PaymentInitializeResponse;
import com.primp.booking_service.dto.PaymentVerifyRequest;
import com.primp.booking_service.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/initialize")
    public ResponseEntity<PaymentInitializeResponse> initialize(
            @RequestHeader("X-User-Id") Long clientId,
            @RequestBody PaymentInitializeRequest request) {
        return ResponseEntity.ok(paymentService.initialize(clientId, request));
    }

    @PostMapping("/verify")
    public ResponseEntity<BookingResponse> verify(
            @RequestHeader("X-User-Id") Long clientId,
            @RequestBody PaymentVerifyRequest request) {
        return ResponseEntity.ok(paymentService.verify(clientId, request));
    }
}