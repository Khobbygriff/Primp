package com.primp.booking_service.dto;

import com.primp.booking_service.model.BookingStatusHistory;
import java.time.LocalDateTime;

public class BookingStatusHistoryResponse {
    private Long id;
    private Long bookingId;
    private String status;
    private LocalDateTime changedAt;
    private Long changedBy;

    public BookingStatusHistoryResponse(BookingStatusHistory history) {
        this.id = history.getId();
        this.bookingId = history.getBookingId();
        this.status = history.getStatus().name();
        this.changedAt = history.getChangedAt();
        this.changedBy = history.getChangedBy();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getBookingId() { return bookingId; }
    public void setBookingId(Long bookingId) { this.bookingId = bookingId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getChangedAt() { return changedAt; }
    public void setChangedAt(LocalDateTime changedAt) { this.changedAt = changedAt; }

    public Long getChangedBy() { return changedBy; }
    public void setChangedBy(Long changedBy) { this.changedBy = changedBy; }
}