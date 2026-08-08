package com.primp.user_service.dto;

import java.time.LocalDateTime;

public class PremiumReconciliationResponse {
    private Long purchaseId;
    private String paymentReference;
    private String paystackStatus;
    private Double paystackAmount;
    private boolean matchesLocalRecord;
    private LocalDateTime checkedAt;

    public Long getPurchaseId() { return purchaseId; }
    public void setPurchaseId(Long purchaseId) { this.purchaseId = purchaseId; }
    public String getPaymentReference() { return paymentReference; }
    public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }
    public String getPaystackStatus() { return paystackStatus; }
    public void setPaystackStatus(String paystackStatus) { this.paystackStatus = paystackStatus; }
    public Double getPaystackAmount() { return paystackAmount; }
    public void setPaystackAmount(Double paystackAmount) { this.paystackAmount = paystackAmount; }
    public boolean isMatchesLocalRecord() { return matchesLocalRecord; }
    public void setMatchesLocalRecord(boolean matchesLocalRecord) { this.matchesLocalRecord = matchesLocalRecord; }
    public LocalDateTime getCheckedAt() { return checkedAt; }
    public void setCheckedAt(LocalDateTime checkedAt) { this.checkedAt = checkedAt; }
}