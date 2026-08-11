package com.primp.booking_service.service;

import com.primp.booking_service.client.PaystackClient;
import com.primp.booking_service.dto.BookingRequest;
import com.primp.booking_service.dto.BookingResponse;
import com.primp.booking_service.dto.PaymentInitializeRequest;
import com.primp.booking_service.dto.PaymentInitializeResponse;
import com.primp.booking_service.dto.PaymentVerifyRequest;
import com.primp.booking_service.model.Booking;
import com.primp.booking_service.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.UUID;

/**
 * Bridges Primp's booking-creation flow with Paystack's Transactions API.
 * A booking is only ever created once Paystack confirms the charge
 * succeeded server-side — the client never gets to create a priced booking
 * by calling /api/bookings directly with a self-reported agreedPrice.
 */
@Service
public class PaymentService {

    private static final String CURRENCY = "GHS";
    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final PaystackClient paystackClient;
    private final BookingRepository bookingRepository;
    private final BookingService bookingService;

    @Value("${paystack.public-key}")
    private String publicKey;

    public PaymentService(PaystackClient paystackClient, BookingRepository bookingRepository, BookingService bookingService) {
        this.paystackClient = paystackClient;
        this.bookingRepository = bookingRepository;
        this.bookingService = bookingService;
    }

    public PaymentInitializeResponse initialize(Long clientId, PaymentInitializeRequest request) {
        if (request.getAgreedPrice() == null || request.getAgreedPrice() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "An agreed service price greater than zero is required to pay for a booking");
        }
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "An email address is required to pay with Paystack");
        }
        if (request.getProfessionalId() == null || request.getServiceType() == null
                || request.getPreferredDate() == null || request.getLocation() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing booking details");
        }

        String reference = "PRIMP-" + UUID.randomUUID();
        long amountInSubunit = Math.round(request.getAgreedPrice() * 100);

        // Everything needed to create the booking afterward is stored in
        // Paystack's metadata — read back and trusted only from Paystack's
        // own verify response, never re-trusted from the client at that point.
        Map<String, Object> metadata = Map.of(
                "clientId", clientId,
                "professionalId", request.getProfessionalId(),
                "serviceType", request.getServiceType(),
                "preferredDate", request.getPreferredDate().format(ISO),
                "location", request.getLocation(),
                "notes", request.getNotes() != null ? request.getNotes() : "",
                "agreedPrice", request.getAgreedPrice()
        );

        Map<String, Object> data = paystackClient.initializeTransaction(
                request.getEmail(), amountInSubunit, reference, CURRENCY, metadata);

        return new PaymentInitializeResponse(
                reference,
                (String) data.get("access_code"),
                (String) data.get("authorization_url"),
                publicKey,
                amountInSubunit,
                CURRENCY,
                request.getEmail()
        );
    }

    @SuppressWarnings("unchecked")
    public BookingResponse verify(Long authenticatedClientId, PaymentVerifyRequest request) {
        if (request.getReference() == null || request.getReference().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A payment reference is required");
        }

        Booking existing = bookingRepository.findByPaymentReference(request.getReference()).orElse(null);
        if (existing != null) {
            return new BookingResponse(existing);
        }

        Map<String, Object> data = paystackClient.verifyTransaction(request.getReference());

        String status = (String) data.get("status");
        if (!"success".equals(status)) {
            throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED,
                    "Payment was not successful (status: " + status + ")");
        }

        Map<String, Object> metadata = (Map<String, Object>) data.get("metadata");
        if (metadata == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Payment record is missing booking metadata");
        }

        Long verifiedClientId = asLong(metadata.get("clientId"));
        if (verifiedClientId == null || !verifiedClientId.equals(authenticatedClientId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This payment does not belong to you");
        }

        return createBookingFromVerifiedPayment(request.getReference(), data, metadata);
    }

    /**
     * Entry point for the Paystack webhook — see gateway's
     * PaystackWebhookController. Skips the ownership check above because
     * there's no authenticated caller here; trust comes from the webhook's
     * HMAC signature already having been verified upstream.
     */
    @SuppressWarnings("unchecked")
    public BookingResponse processWebhookPayment(String reference) {
        Booking existing = bookingRepository.findByPaymentReference(reference).orElse(null);
        if (existing != null) {
            return new BookingResponse(existing); // Already created via the client-initiated /verify path.
        }

        Map<String, Object> data = paystackClient.verifyTransaction(reference);

        String status = (String) data.get("status");
        if (!"success".equals(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment was not successful (status: " + status + ")");
        }

        Map<String, Object> metadata = (Map<String, Object>) data.get("metadata");
        if (metadata == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Payment record is missing booking metadata");
        }

        return createBookingFromVerifiedPayment(reference, data, metadata);
    }

    /** Shared by both entry points above — the only place a Booking row actually gets created from a Paystack charge. */
    private BookingResponse createBookingFromVerifiedPayment(String reference, Map<String, Object> data, Map<String, Object> metadata) {
        Double agreedPrice = asDouble(metadata.get("agreedPrice"));
        if (agreedPrice == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Payment record is missing the agreed price");
        }

        Long verifiedAmount = asLong(data.get("amount"));
        long expectedAmount = Math.round(agreedPrice * 100);
        if (verifiedAmount == null || verifiedAmount != expectedAmount) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Paid amount does not match the booking price");
        }

        Long professionalId = asLong(metadata.get("professionalId"));
        Long clientId = asLong(metadata.get("clientId"));
        if (professionalId == null || clientId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Payment record is missing client/professional");
        }

        BookingRequest bookingRequest = new BookingRequest();
        bookingRequest.setProfessionalId(professionalId);
        bookingRequest.setServiceType((String) metadata.get("serviceType"));
        bookingRequest.setPreferredDate(LocalDateTime.parse((String) metadata.get("preferredDate"), ISO));
        bookingRequest.setLocation((String) metadata.get("location"));
        bookingRequest.setNotes((String) metadata.get("notes"));
        bookingRequest.setAgreedPrice(agreedPrice);

        BookingResponse created = bookingService.createBooking(clientId, bookingRequest);

        Booking saved = bookingRepository.findById(created.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Booking not found after creation"));
        saved.setPaymentReference(reference);
        bookingRepository.save(saved);

        return new BookingResponse(saved);
    }

    /**
     * Paystack does not reliably preserve JSON types for custom metadata —
     * numeric fields we send as numbers frequently come back stringified.
     * These helpers accept either representation instead of assuming Number.
     */
    private Long asLong(Object value) {
        if (value == null) return null;
        if (value instanceof Number) return ((Number) value).longValue();
        try {
            return Long.parseLong(value.toString().trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Double asDouble(Object value) {
        if (value == null) return null;
        if (value instanceof Number) return ((Number) value).doubleValue();
        try {
            return Double.parseDouble(value.toString().trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}