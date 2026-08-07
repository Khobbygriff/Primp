package com.primp.booking_service.controller;

import com.primp.booking_service.dto.BookingRequest;
import com.primp.booking_service.dto.BookingResponse;
import com.primp.booking_service.dto.BookingStatusHistoryResponse;
import com.primp.booking_service.dto.EarningsAnalyticsResponse;
import com.primp.booking_service.security.JwtUtil;
import com.primp.booking_service.service.AnalyticsService;
import com.primp.booking_service.service.BookingService;
import com.primp.booking_service.service.ReceiptService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;
    private final ReceiptService receiptService;
    private final AnalyticsService analyticsService;
    private final JwtUtil jwtUtil;

    public BookingController(BookingService bookingService, ReceiptService receiptService,
                             AnalyticsService analyticsService, JwtUtil jwtUtil) {
        this.bookingService = bookingService;
        this.receiptService = receiptService;
        this.analyticsService = analyticsService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(
            @RequestHeader("X-User-Id") Long clientId,
            @RequestBody BookingRequest request) {
        return ResponseEntity.ok(bookingService.createBooking(clientId, request));
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<BookingResponse>> getClientBookings(
            @RequestHeader("X-User-Id") Long authenticatedUserId,
            @PathVariable Long clientId) {
        if (!authenticatedUserId.equals(clientId)) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "Unauthorized");
        }
        return ResponseEntity.ok(bookingService.getClientBookings(clientId));
    }

    @GetMapping("/professional/{professionalId}")
    public ResponseEntity<List<BookingResponse>> getProfessionalBookings(
            @RequestHeader("X-User-Id") Long authenticatedUserId,
            @PathVariable Long professionalId) {
        if (!authenticatedUserId.equals(professionalId)) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "Unauthorized");
        }
        return ResponseEntity.ok(bookingService.getProfessionalBookings(professionalId));
    }

    @GetMapping("/professional/{professionalId}/fees-summary")
    public ResponseEntity<Map<String, Object>> getFeesSummary(
            @RequestHeader("X-User-Id") Long authenticatedUserId,
            @PathVariable Long professionalId) {
        if (!authenticatedUserId.equals(professionalId)) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "Unauthorized");
        }
        double totalFees = bookingService.getTotalFeesCollectedForProfessional(professionalId);
        return ResponseEntity.ok(Map.of("professionalId", professionalId, "totalPrimpFeesCollected", totalFees));
    }

    @GetMapping("/professional/{professionalId}/analytics")
    public ResponseEntity<EarningsAnalyticsResponse> getEarningsAnalytics(
            @RequestHeader("X-User-Id") Long authenticatedUserId,
            @PathVariable Long professionalId) {
        return ResponseEntity.ok(analyticsService.getEarningsAnalytics(professionalId, authenticatedUserId));
    }

    @PutMapping("/{bookingId}/status")
    public ResponseEntity<BookingResponse> updateStatus(
            @RequestHeader("X-User-Id") Long authenticatedUserId,
            @PathVariable Long bookingId,
            @RequestParam String status) {
        return ResponseEntity.ok(bookingService.updateStatus(bookingId, status, authenticatedUserId));
    }

    @PutMapping("/{bookingId}/close")
    public ResponseEntity<BookingResponse> closeBooking(
            @RequestHeader("X-User-Id") Long authenticatedUserId,
            @PathVariable Long bookingId) {
        return ResponseEntity.ok(bookingService.closeBooking(bookingId, authenticatedUserId));
    }

    @GetMapping("/{bookingId}/history")
    public ResponseEntity<List<BookingStatusHistoryResponse>> getBookingHistory(
            @RequestHeader("X-User-Id") Long authenticatedUserId,
            @PathVariable Long bookingId) {
        return ResponseEntity.ok(bookingService.getBookingHistory(bookingId, authenticatedUserId));
    }

    @GetMapping("/{bookingId}/receipt")
    public ResponseEntity<byte[]> getReceipt(
            @RequestHeader("X-User-Id") Long authenticatedUserId,
            @PathVariable Long bookingId) {
        byte[] pdf = receiptService.generateReceipt(bookingId, authenticatedUserId);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "primp-receipt-" + bookingId + ".pdf");
        return new ResponseEntity<>(pdf, headers, org.springframework.http.HttpStatus.OK);
    }

    @GetMapping("/{bookingId}")
    public ResponseEntity<BookingResponse> getBookingById(
            @RequestHeader("X-User-Id") Long authenticatedUserId,
            @PathVariable Long bookingId) {
        return ResponseEntity.ok(bookingService.getBookingById(bookingId, authenticatedUserId));
    }
}