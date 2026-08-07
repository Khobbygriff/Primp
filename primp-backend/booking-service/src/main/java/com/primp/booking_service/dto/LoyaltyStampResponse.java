package com.primp.booking_service.dto;

import com.primp.booking_service.model.LoyaltyStamp;
import java.time.LocalDateTime;

public class LoyaltyStampResponse {
    private Long clientId;
    private String clientName;
    private Integer stampCount;
    private Integer stampsUntilNextReward;
    private Boolean rewardMilestone;
    private LocalDateTime lastBookingClosedAt;
    private LocalDateTime lastMessageSentAt;

    public LoyaltyStampResponse(LoyaltyStamp stamp, String clientName) {
        this.clientId = stamp.getClientId();
        this.clientName = clientName;
        this.stampCount = stamp.getStampCount();
        this.stampsUntilNextReward = stamp.getStampsUntilNextReward();
        this.rewardMilestone = stamp.isRewardMilestone();
        this.lastBookingClosedAt = stamp.getLastBookingClosedAt();
        this.lastMessageSentAt = stamp.getLastMessageSentAt();
    }

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }

    public Integer getStampCount() { return stampCount; }
    public void setStampCount(Integer stampCount) { this.stampCount = stampCount; }

    public Integer getStampsUntilNextReward() { return stampsUntilNextReward; }
    public void setStampsUntilNextReward(Integer stampsUntilNextReward) { this.stampsUntilNextReward = stampsUntilNextReward; }

    public Boolean getRewardMilestone() { return rewardMilestone; }
    public void setRewardMilestone(Boolean rewardMilestone) { this.rewardMilestone = rewardMilestone; }

    public LocalDateTime getLastBookingClosedAt() { return lastBookingClosedAt; }
    public void setLastBookingClosedAt(LocalDateTime lastBookingClosedAt) { this.lastBookingClosedAt = lastBookingClosedAt; }

    public LocalDateTime getLastMessageSentAt() { return lastMessageSentAt; }
    public void setLastMessageSentAt(LocalDateTime lastMessageSentAt) { this.lastMessageSentAt = lastMessageSentAt; }
}