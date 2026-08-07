package com.primp.booking_service.controller;

import com.primp.booking_service.dto.LoyaltyStampResponse;
import com.primp.booking_service.dto.PersonalizedOfferRequest;
import com.primp.booking_service.service.LoyaltyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings/professional/{professionalId}/loyalty")
public class LoyaltyController {

    private final LoyaltyService loyaltyService;

    public LoyaltyController(LoyaltyService loyaltyService) {
        this.loyaltyService = loyaltyService;
    }

    @GetMapping
    public ResponseEntity<List<LoyaltyStampResponse>> getLoyaltyBoard(
            @RequestHeader("X-User-Id") Long authenticatedUserId,
            @PathVariable Long professionalId) {
        return ResponseEntity.ok(loyaltyService.getLoyaltyBoard(professionalId, authenticatedUserId));
    }

    @PostMapping("/client/{clientId}/remind")
    public ResponseEntity<Void> sendRebookingReminder(
            @RequestHeader("X-User-Id") Long authenticatedUserId,
            @PathVariable Long professionalId,
            @PathVariable Long clientId) {
        loyaltyService.sendRebookingReminder(professionalId, clientId, authenticatedUserId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/client/{clientId}/offer")
    public ResponseEntity<Void> sendPersonalizedOffer(
            @RequestHeader("X-User-Id") Long authenticatedUserId,
            @PathVariable Long professionalId,
            @PathVariable Long clientId,
            @RequestBody PersonalizedOfferRequest request) {
        loyaltyService.sendPersonalizedOffer(professionalId, clientId, request.getMessage(), authenticatedUserId);
        return ResponseEntity.ok().build();
    }
}