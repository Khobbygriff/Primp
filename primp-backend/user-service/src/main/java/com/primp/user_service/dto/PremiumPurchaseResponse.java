package com.primp.user_service.dto;

import com.primp.user_service.model.PremiumPurchase;
import java.time.LocalDateTime;

public class PremiumPurchaseResponse {
    private Long id;
    private Long userId;
    private String feature;
    private String duration;
    private String paymentReference;
    private Double amount;
    private LocalDateTime purchasedAt;

    public PremiumPurchaseResponse(PremiumPurchase p) {
        this.id = p.getId();
        this.userId = p.getUserId();
        this.feature = p.getFeature();
        this.duration = p.getDuration();
        this.paymentReference = p.getPaymentReference();
        this.amount = p.getAmount();
        this.purchasedAt = p.getPurchasedAt();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getFeature() { return feature; }
    public void setFeature(String feature) { this.feature = feature; }
    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }
    public String getPaymentReference() { return paymentReference; }
    public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }
    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }
    public LocalDateTime getPurchasedAt() { return purchasedAt; }
    public void setPurchasedAt(LocalDateTime purchasedAt) { this.purchasedAt = purchasedAt; }
}