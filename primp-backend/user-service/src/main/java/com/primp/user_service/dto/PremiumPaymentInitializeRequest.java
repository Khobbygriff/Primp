package com.primp.user_service.dto;

public class PremiumPaymentInitializeRequest {
    private String feature;
    private String email;
    private String duration; // "WEEKLY" | "MONTHLY" — only meaningful for PRIORITY_LISTING; ignored otherwise

    public String getFeature() { return feature; }
    public void setFeature(String feature) { this.feature = feature; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }
}