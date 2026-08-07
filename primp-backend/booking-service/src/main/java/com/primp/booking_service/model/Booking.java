package com.primp.booking_service.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
public class Booking {

    private static final double PRIMP_FEE_RATE = 0.08;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "client_id", nullable = false)
    private Long clientId;

    @Column(name = "professional_id", nullable = false)
    private Long professionalId;

    @Column(name = "service_type", nullable = false)
    private String serviceType;

    @Column(name = "preferred_date", nullable = false)
    private LocalDateTime preferredDate;

    private String location;
    private String notes;

    @Column(name = "agreed_price", nullable = false)
    private Double agreedPrice;

    @Column(name = "primp_fee_rate", nullable = false)
    private Double primpFeeRate;

    @Column(name = "primp_fee", nullable = false)
    private Double primpFee;

    @Column(name = "total_amount", nullable = false)
    private Double totalAmount;

    @Column(name = "payment_reference", unique = true)
    private String paymentReference;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        status = Status.REQUESTED;
        recalculateFee();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        recalculateFee();
    }

    private void recalculateFee() {
        if (primpFeeRate == null) primpFeeRate = PRIMP_FEE_RATE;
        double price = agreedPrice != null ? agreedPrice : 0.0;
        primpFee = Math.round(price * primpFeeRate * 100.0) / 100.0;
        totalAmount = Math.round((price + primpFee) * 100.0) / 100.0;
    }

    public enum Status {
        REQUESTED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, CLOSED
    }

    // Getters and Setters
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

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}