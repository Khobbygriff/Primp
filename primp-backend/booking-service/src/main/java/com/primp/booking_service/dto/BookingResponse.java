package com.primp.booking_service.dto;

import com.primp.booking_service.model.Booking;
import java.time.LocalDateTime;

public class BookingResponse {
    private Long id;
    private Long clientId;
    private Long professionalId;
    private String serviceType;
    private LocalDateTime preferredDate;
    private String location;
    private String notes;
    private Double agreedPrice;
    private Double primpFeeRate;
    private Double primpFee;
    private Double totalAmount;
    private String paymentReference;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public BookingResponse(Booking booking) {
        this.id = booking.getId();
        this.clientId = booking.getClientId();
        this.professionalId = booking.getProfessionalId();
        this.serviceType = booking.getServiceType();
        this.preferredDate = booking.getPreferredDate();
        this.location = booking.getLocation();
        this.notes = booking.getNotes();
        this.agreedPrice = booking.getAgreedPrice();
        this.primpFeeRate = booking.getPrimpFeeRate();
        this.primpFee = booking.getPrimpFee();
        this.totalAmount = booking.getTotalAmount();
        this.paymentReference = booking.getPaymentReference();
        this.status = booking.getStatus().name();
        this.createdAt = booking.getCreatedAt();
        this.updatedAt = booking.getUpdatedAt();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public Long getProfessionalId() { return professionalId; }
    public void setProfessionalId(Long professionalId) { this.professionalId = professionalId; }

    public String getServiceType() { return serviceType; }
    public void setServiceType(String serviceType) { this.serviceType = serviceType; }

    public LocalDateTime getPreferredDate() { return preferredDate; }
    public void setPreferredDate(LocalDateTime preferredDate) { this.preferredDate = preferredDate; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Double getAgreedPrice() { return agreedPrice; }
    public void setAgreedPrice(Double agreedPrice) { this.agreedPrice = agreedPrice; }

    public Double getPrimpFeeRate() { return primpFeeRate; }
    public void setPrimpFeeRate(Double primpFeeRate) { this.primpFeeRate = primpFeeRate; }

    public Double getPrimpFee() { return primpFee; }
    public void setPrimpFee(Double primpFee) { this.primpFee = primpFee; }

    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }

    public String getPaymentReference() { return paymentReference; }
    public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}