package com.primp.user_service.dto;

public class PremiumPaymentInitializeResponse {
    private String reference;
    private String accessCode;
    private String authorizationUrl;
    private String publicKey;
    private long amount;
    private String currency;
    private String email;
    private String feature;
    private String duration;

    public PremiumPaymentInitializeResponse(String reference, String accessCode, String authorizationUrl,
                                            String publicKey, long amount, String currency,
                                            String email, String feature, String duration) {
        this.reference = reference;
        this.accessCode = accessCode;
        this.authorizationUrl = authorizationUrl;
        this.publicKey = publicKey;
        this.amount = amount;
        this.currency = currency;
        this.email = email;
        this.feature = feature;
        this.duration = duration;
    }


    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }

    public String getAccessCode() { return accessCode; }
    public void setAccessCode(String accessCode) { this.accessCode = accessCode; }

    public String getAuthorizationUrl() { return authorizationUrl; }
    public void setAuthorizationUrl(String authorizationUrl) { this.authorizationUrl = authorizationUrl; }

    public String getPublicKey() { return publicKey; }
    public void setPublicKey(String publicKey) { this.publicKey = publicKey; }

    public long getAmount() { return amount; }
    public void setAmount(long amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFeature() { return feature; }
    public void setFeature(String feature) { this.feature = feature; }

    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }
}