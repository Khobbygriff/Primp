package com.primp.booking_service.service;

import com.primp.booking_service.client.NotificationClient;
import com.primp.booking_service.client.UserClient;
import com.primp.booking_service.dto.LoyaltyStampResponse;
import com.primp.booking_service.model.LoyaltyStamp;
import com.primp.booking_service.repository.LoyaltyStampRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LoyaltyService {

    /** Prevents a professional from spamming the same client repeatedly. */
    private static final Duration MESSAGE_COOLDOWN = Duration.ofDays(3);

    private final LoyaltyStampRepository loyaltyStampRepository;
    private final UserClient userClient;
    private final NotificationClient notificationClient;

    public LoyaltyService(LoyaltyStampRepository loyaltyStampRepository,
                          UserClient userClient,
                          NotificationClient notificationClient) {
        this.loyaltyStampRepository = loyaltyStampRepository;
        this.userClient = userClient;
        this.notificationClient = notificationClient;
    }

    /**
     * Called by BookingService whenever a booking transitions to CLOSED.
     * Stamp accrual itself is not gated behind the premium flag — only the
     * ability to act on the data (reminders/offers) is.
     */
    public void recordCompletedBooking(Long professionalId, Long clientId) {
        LoyaltyStamp stamp = loyaltyStampRepository.findByProfessionalIdAndClientId(professionalId, clientId)
                .orElseGet(() -> {
                    LoyaltyStamp fresh = new LoyaltyStamp();
                    fresh.setProfessionalId(professionalId);
                    fresh.setClientId(clientId);
                    fresh.setStampCount(0);
                    return fresh;
                });

        stamp.setStampCount(stamp.getStampCount() + 1);
        stamp.setLastBookingClosedAt(LocalDateTime.now());
        loyaltyStampRepository.save(stamp);

        if (stamp.isRewardMilestone()) {
            notificationClient.sendNotification(
                    clientId,
                    "NEW_REVIEW",
                    "🎉 Loyalty Reward Unlocked",
                    "You've completed " + stamp.getStampCount() + " bookings with this professional. Ask them about your loyalty reward!",
                    null
            );
        }
    }

    public List<LoyaltyStampResponse> getLoyaltyBoard(Long professionalId, Long authenticatedProfessionalId) {
        if (!professionalId.equals(authenticatedProfessionalId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized");
        }

        return loyaltyStampRepository.findByProfessionalIdOrderByStampCountDesc(professionalId)
                .stream()
                .map(stamp -> new LoyaltyStampResponse(stamp, userClient.getUserName(stamp.getClientId())))
                .collect(Collectors.toList());
    }

    public void sendRebookingReminder(Long professionalId, Long clientId, Long authenticatedProfessionalId) {
        LoyaltyStamp stamp = requirePremiumAndStamp(professionalId, clientId, authenticatedProfessionalId);

        notificationClient.sendNotification(
                clientId,
                "BOOKING_REQUEST",
                "We miss you! 💇",
                "It's been a while since your last visit. Book again with your favorite Primp professional today.",
                null
        );

        stamp.setLastMessageSentAt(LocalDateTime.now());
        loyaltyStampRepository.save(stamp);
    }

    public void sendPersonalizedOffer(Long professionalId, Long clientId, String message, Long authenticatedProfessionalId) {
        if (message == null || message.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Offer message is required");
        }

        LoyaltyStamp stamp = requirePremiumAndStamp(professionalId, clientId, authenticatedProfessionalId);

        notificationClient.sendNotification(
                clientId,
                "BOOKING_REQUEST",
                "🎁 A special offer for you",
                message,
                null
        );

        stamp.setLastMessageSentAt(LocalDateTime.now());
        loyaltyStampRepository.save(stamp);
    }

    private LoyaltyStamp requirePremiumAndStamp(Long professionalId, Long clientId, Long authenticatedProfessionalId) {
        if (!professionalId.equals(authenticatedProfessionalId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized");
        }

        if (!userClient.hasClientLoyaltyTools(professionalId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Unlock Client Loyalty Tools to send rebooking reminders and offers");
        }

        LoyaltyStamp stamp = loyaltyStampRepository.findByProfessionalIdAndClientId(professionalId, clientId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "This client has no completed booking history with you yet"));

        if (stamp.getLastMessageSentAt() != null
                && Duration.between(stamp.getLastMessageSentAt(), LocalDateTime.now()).compareTo(MESSAGE_COOLDOWN) < 0) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "A message was already sent to this client recently — please wait before sending another");
        }

        return stamp;
    }
}