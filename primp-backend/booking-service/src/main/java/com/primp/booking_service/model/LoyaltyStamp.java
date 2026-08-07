package com.primp.booking_service.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Client Loyalty Tools — one row per (professional, client) pair.
 * Stamp count increments automatically whenever a booking between the two
 * reaches CLOSED, independent of whether the professional has unlocked the
 * premium tools; the data accrues for free so the feature has instant value
 * the moment it's unlocked, but acting on it (reminders/offers) is gated.
 */
@Entity
@Table(name = "loyalty_stamps", uniqueConstraints = @UniqueConstraint(columnNames = {"professional_id", "client_id"}))
public class LoyaltyStamp {

    private static final int STAMPS_PER_REWARD = 5;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "professional_id", nullable = false)
    private Long professionalId;

    @Column(name = "client_id", nullable = false)
    private Long clientId;

    @Column(name = "stamp_count", nullable = false)
    private Integer stampCount = 0;

    @Column(name = "last_booking_closed_at")
    private LocalDateTime lastBookingClosedAt;

    @Column(name = "last_message_sent_at")
    private LocalDateTime lastMessageSentAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProfessionalId() { return professionalId; }
    public void setProfessionalId(Long professionalId) { this.professionalId = professionalId; }

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public Integer getStampCount() { return stampCount; }
    public void setStampCount(Integer stampCount) { this.stampCount = stampCount; }

    public LocalDateTime getLastBookingClosedAt() { return lastBookingClosedAt; }
    public void setLastBookingClosedAt(LocalDateTime lastBookingClosedAt) { this.lastBookingClosedAt = lastBookingClosedAt; }

    public LocalDateTime getLastMessageSentAt() { return lastMessageSentAt; }
    public void setLastMessageSentAt(LocalDateTime lastMessageSentAt) { this.lastMessageSentAt = lastMessageSentAt; }

    public boolean isRewardMilestone() {
        return stampCount != null && stampCount > 0 && stampCount % STAMPS_PER_REWARD == 0;
    }

    public int getStampsUntilNextReward() {
        if (stampCount == null) return STAMPS_PER_REWARD;
        int remainder = stampCount % STAMPS_PER_REWARD;
        return remainder == 0 ? STAMPS_PER_REWARD : STAMPS_PER_REWARD - remainder;
    }
}