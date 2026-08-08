package com.primp.booking_service.controller;

import com.primp.booking_service.dto.BookingReconciliationResponse;
import com.primp.booking_service.dto.BookingResponse;
import com.primp.booking_service.dto.PageResponse;
import com.primp.booking_service.service.AdminBookingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin/bookings")
public class AdminBookingController {

    private final AdminBookingService adminBookingService;

    public AdminBookingController(AdminBookingService adminBookingService) {
        this.adminBookingService = adminBookingService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<BookingResponse>> list(
            @RequestHeader(value = "X-User-Role", required = false) String callerRole,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String hasPaymentReference,
            @RequestParam(required = false) Long userId) {
        requireAdmin(callerRole);
        return ResponseEntity.ok(
                adminBookingService.listBookings(search, status, hasPaymentReference, userId, page, pageSize));
    }

    @PostMapping("/{bookingId}/reconcile-payment")
    public ResponseEntity<BookingReconciliationResponse> reconcile(
            @RequestHeader(value = "X-User-Role", required = false) String callerRole,
            @PathVariable Long bookingId) {
        requireAdmin(callerRole);
        return ResponseEntity.ok(adminBookingService.reconcilePayment(bookingId));
    }

    private void requireAdmin(String callerRole) {
        if (!"ADMIN".equals(callerRole)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }
    }
}