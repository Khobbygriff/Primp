package com.primp.booking_service.service;

import com.primp.booking_service.client.PaystackClient;
import com.primp.booking_service.dto.BookingReconciliationResponse;
import com.primp.booking_service.dto.BookingResponse;
import com.primp.booking_service.dto.PageResponse;
import com.primp.booking_service.model.Booking;
import com.primp.booking_service.repository.BookingRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminBookingService {

    private final BookingRepository bookingRepository;
    private final PaystackClient paystackClient;

    public AdminBookingService(BookingRepository bookingRepository, PaystackClient paystackClient) {
        this.bookingRepository = bookingRepository;
        this.paystackClient = paystackClient;
    }

    public PageResponse<BookingResponse> listBookings(String search, String statusParam,
                                                      String hasReferenceParam, Long userId,
                                                      int page, int pageSize) {
        Booking.Status status = null;
        if (statusParam != null && !statusParam.isBlank()) {
            try {
                status = Booking.Status.valueOf(statusParam.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown status: " + statusParam);
            }
        }

        Boolean hasReference = null;
        if ("YES".equalsIgnoreCase(hasReferenceParam)) hasReference = true;
        else if ("NO".equalsIgnoreCase(hasReferenceParam)) hasReference = false;

        Pageable pageable = PageRequest.of(Math.max(page - 1, 0), pageSize,
                Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Booking> result = bookingRepository.search(
                (search == null || search.isBlank()) ? null : search.trim(),
                status, hasReference, userId, pageable);

        List<BookingResponse> items = result.getContent().stream()
                .map(BookingResponse::new)
                .collect(Collectors.toList());

        return new PageResponse<>(items, page, pageSize, result.getTotalElements(), result.getTotalPages());
    }

    /** Re-verifies a charge against Paystack live — see PaystackClient#verifyTransaction. */
    public BookingReconciliationResponse reconcilePayment(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

        if (booking.getPaymentReference() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "This booking has no payment reference to reconcile");
        }

        Map<String, Object> data = paystackClient.verifyTransaction(booking.getPaymentReference());
        String status = (String) data.get("status");
        Long amountSubunit = asLong(data.get("amount"));
        Double paystackAmount = amountSubunit != null ? amountSubunit / 100.0 : null;

        boolean matches = "success".equals(status)
                && booking.getTotalAmount() != null
                && paystackAmount != null
                && Math.abs(booking.getTotalAmount() - paystackAmount) < 0.01;

        BookingReconciliationResponse response = new BookingReconciliationResponse();
        response.setBookingId(booking.getId());
        response.setPaymentReference(booking.getPaymentReference());
        response.setPaystackStatus(status);
        response.setPaystackAmount(paystackAmount);
        response.setMatchesLocalRecord(matches);
        response.setCheckedAt(LocalDateTime.now());
        return response;
    }

    private Long asLong(Object value) {
        if (value == null) return null;
        if (value instanceof Number) return ((Number) value).longValue();
        try {
            return Long.parseLong(value.toString().trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}