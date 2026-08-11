package com.primp.booking_service.service;

import com.primp.booking_service.client.NotificationClient;
import com.primp.booking_service.dto.BookingRequest;
import com.primp.booking_service.dto.BookingResponse;
import com.primp.booking_service.dto.BookingStatusHistoryResponse;
import com.primp.booking_service.model.Booking;
import com.primp.booking_service.model.BookingStatusHistory;
import com.primp.booking_service.repository.BookingRepository;
import com.primp.booking_service.repository.BookingStatusHistoryRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final BookingStatusHistoryRepository bookingStatusHistoryRepository;
    private final NotificationClient notificationClient;
    private final LoyaltyService loyaltyService;

    public BookingService(BookingRepository bookingRepository,
                          BookingStatusHistoryRepository bookingStatusHistoryRepository,
                          NotificationClient notificationClient,
                          LoyaltyService loyaltyService) {
        this.bookingRepository = bookingRepository;
        this.bookingStatusHistoryRepository = bookingStatusHistoryRepository;
        this.notificationClient = notificationClient;
        this.loyaltyService = loyaltyService;
    }

    public BookingResponse createBooking(Long clientId, BookingRequest request) {
        if (request.getAgreedPrice() == null || request.getAgreedPrice() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "An agreed service price greater than zero is required to create a booking");
        }

        Booking booking = new Booking();
        booking.setClientId(clientId);
        booking.setProfessionalId(request.getProfessionalId());
        booking.setServiceType(request.getServiceType());
        booking.setPreferredDate(request.getPreferredDate());
        booking.setLocation(request.getLocation());
        booking.setNotes(request.getNotes());
        booking.setAgreedPrice(request.getAgreedPrice());

        Booking saved = bookingRepository.save(booking);
        recordHistory(saved, clientId);

        // Notify professional of new booking request
        notificationClient.sendNotification(
                saved.getProfessionalId(),
                "BOOKING_REQUEST",
                "New Booking Request",
                "You have a new booking request for " + saved.getServiceType()
                        + " (GH₵ " + String.format("%.2f", saved.getAgreedPrice()) + ")",
                saved.getId()
        );

        return new BookingResponse(saved);
    }

    public List<BookingResponse> getClientBookings(Long clientId) {
        return bookingRepository.findByClientId(clientId)
                .stream()
                .map(BookingResponse::new)
                .collect(Collectors.toList());
    }

    public List<BookingResponse> getProfessionalBookings(Long professionalId) {
        return bookingRepository.findByProfessionalId(professionalId)
                .stream()
                .map(BookingResponse::new)
                .collect(Collectors.toList());
    }

    /**
     * Sum of Primp's transaction fee across every booking a professional has
     * had confirmed to CLOSED — the concrete number behind the proposal's
     * transaction-fee revenue layer and the input to any future
     * Earnings Analytics feature.
     */
    public double getTotalFeesCollectedForProfessional(Long professionalId) {
        return bookingRepository.findByProfessionalIdAndStatus(professionalId, Booking.Status.CLOSED)
                .stream()
                .mapToDouble(b -> b.getPrimpFee() != null ? b.getPrimpFee() : 0.0)
                .sum();
    }

    public BookingResponse updateStatus(Long bookingId, String status, Long authenticatedUserId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        Booking.Status newStatus;
        try {
            newStatus = Booking.Status.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status: " + status);
        }

        boolean isProfessional = booking.getProfessionalId().equals(authenticatedUserId);
        boolean isClient = booking.getClientId().equals(authenticatedUserId);

        if (!isProfessional && !isClient) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized");
        }

        if (newStatus == Booking.Status.CLOSED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Use PUT /api/bookings/{id}/close to close a completed booking");
        }

        if (isClient && !isProfessional) {
            // A client may only cancel their own still-pending request.
            boolean isCancelling = newStatus == Booking.Status.CANCELLED;
            boolean isCancellable = booking.getStatus() == Booking.Status.REQUESTED;
            if (!isCancelling || !isCancellable) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Clients may only cancel a booking that is still pending");
            }
        }

        booking.setStatus(newStatus);
        Booking saved = bookingRepository.save(booking);
        recordHistory(saved, authenticatedUserId);

        // Send notification based on new status
        switch (saved.getStatus()) {
            case CONFIRMED:
                notificationClient.sendNotification(
                        saved.getClientId(),
                        "BOOKING_CONFIRMED",
                        "Booking Confirmed",
                        "Your booking for " + saved.getServiceType() + " has been confirmed",
                        saved.getId()
                );
                break;
            case IN_PROGRESS:
                notificationClient.sendNotification(
                        saved.getClientId(),
                        "BOOKING_CONFIRMED",
                        "Service Started",
                        "Your " + saved.getServiceType() + " service has started",
                        saved.getId()
                );
                break;
            case COMPLETED:
                notificationClient.sendNotification(
                        saved.getClientId(),
                        "BOOKING_COMPLETED",
                        "Service Completed",
                        "Your " + saved.getServiceType() + " service is complete. Please confirm and leave a review!",
                        saved.getId()
                );
                break;
            case CANCELLED:
                Long recipient = isProfessional ? saved.getClientId() : saved.getProfessionalId();
                String title = isProfessional ? "Booking Cancelled" : "Booking Request Cancelled";
                String body = isProfessional
                        ? "Your booking for " + saved.getServiceType() + " has been cancelled"
                        : "The client cancelled their request for " + saved.getServiceType();
                notificationClient.sendNotification(recipient, "BOOKING_CANCELLED", title, body, saved.getId());
                break;
            default:
                break;
        }

        return new BookingResponse(saved);
    }

    public BookingResponse closeBooking(Long bookingId, Long authenticatedClientId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getClientId().equals(authenticatedClientId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the client can confirm completion");
        }

        if (booking.getStatus() != Booking.Status.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only a completed booking can be confirmed and closed");
        }

        // No fee is charged on cancelled or disputed bookings (§7.1) — the fee
        // is only realized once a booking reaches CLOSED, which is exactly
        // the transition happening here.
        booking.setStatus(Booking.Status.CLOSED);
        Booking saved = bookingRepository.save(booking);
        recordHistory(saved, authenticatedClientId);

        // Client Loyalty Tools — every closed booking earns the client
        // a stamp with this professional.
        loyaltyService.recordCompletedBooking(saved.getProfessionalId(), saved.getClientId());

        return new BookingResponse(saved);
    }

    public BookingResponse getBookingById(Long bookingId, Long authenticatedUserId, String role) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        boolean isParty = booking.getClientId().equals(authenticatedUserId)
                || booking.getProfessionalId().equals(authenticatedUserId);
        if (!isParty && !"ADMIN".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized");
        }

        return new BookingResponse(booking);
    }

    public List<BookingStatusHistoryResponse> getBookingHistory(Long bookingId, Long authenticatedUserId, String role) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        boolean isParty = booking.getClientId().equals(authenticatedUserId)
                || booking.getProfessionalId().equals(authenticatedUserId);
        if (!isParty && !"ADMIN".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized");
        }

        return bookingStatusHistoryRepository.findByBookingIdOrderByChangedAtAsc(bookingId)
                .stream()
                .map(BookingStatusHistoryResponse::new)
                .collect(Collectors.toList());
    }

    private void recordHistory(Booking booking, Long changedBy) {
        BookingStatusHistory history = new BookingStatusHistory();
        history.setBookingId(booking.getId());
        history.setStatus(booking.getStatus());
        history.setChangedBy(changedBy);
        bookingStatusHistoryRepository.save(history);
    }
}