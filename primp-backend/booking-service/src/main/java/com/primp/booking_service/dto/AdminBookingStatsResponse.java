package com.primp.booking_service.dto;

import java.time.LocalDateTime;

public class AdminBookingStatsResponse {
    private long totalBookings;
    private long requestedCount;
    private long confirmedCount;
    private long inProgressCount;
    private long completedCount;
    private long closedCount;
    private long cancelledCount;
    private long unreconciledBookings;
    private long newBookingsLast30Days;
    private double totalPrimpFeesCollectedAllTime;
    private LocalDateTime generatedAt;

    public long getTotalBookings() { return totalBookings; }
    public void setTotalBookings(long totalBookings) { this.totalBookings = totalBookings; }
    public long getRequestedCount() { return requestedCount; }
    public void setRequestedCount(long requestedCount) { this.requestedCount = requestedCount; }
    public long getConfirmedCount() { return confirmedCount; }
    public void setConfirmedCount(long confirmedCount) { this.confirmedCount = confirmedCount; }
    public long getInProgressCount() { return inProgressCount; }
    public void setInProgressCount(long inProgressCount) { this.inProgressCount = inProgressCount; }
    public long getCompletedCount() { return completedCount; }
    public void setCompletedCount(long completedCount) { this.completedCount = completedCount; }
    public long getClosedCount() { return closedCount; }
    public void setClosedCount(long closedCount) { this.closedCount = closedCount; }
    public long getCancelledCount() { return cancelledCount; }
    public void setCancelledCount(long cancelledCount) { this.cancelledCount = cancelledCount; }
    public long getUnreconciledBookings() { return unreconciledBookings; }
    public void setUnreconciledBookings(long unreconciledBookings) { this.unreconciledBookings = unreconciledBookings; }
    public long getNewBookingsLast30Days() { return newBookingsLast30Days; }
    public void setNewBookingsLast30Days(long newBookingsLast30Days) { this.newBookingsLast30Days = newBookingsLast30Days; }
    public double getTotalPrimpFeesCollectedAllTime() { return totalPrimpFeesCollectedAllTime; }
    public void setTotalPrimpFeesCollectedAllTime(double totalPrimpFeesCollectedAllTime) { this.totalPrimpFeesCollectedAllTime = totalPrimpFeesCollectedAllTime; }
    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }
}