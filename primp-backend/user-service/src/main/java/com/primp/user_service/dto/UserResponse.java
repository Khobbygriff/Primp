package com.primp.user_service.dto;

public class UserResponse {
    private Long id;
    private String profilePhotoUrl;
    private String name;
    private String location;
    private String role;
    private String phone;
    private String specialty;
    private String bio;
    private Boolean isAvailable;
    private Boolean isPriorityListingActive;
    private Boolean hasExtendedPortfolio;
    private Boolean isVerifiedBadge;
    private Boolean hasClientLoyaltyTools;
    private Boolean hasEarningsAnalytics;
    private java.time.LocalDateTime priorityListingExpiresAt;
    private java.time.LocalDateTime clientLoyaltyToolsExpiresAt;
    private java.time.LocalDateTime earningsAnalyticsExpiresAt;
    private Double workLatitude;
    private Double workLongitude;
    private Integer serviceRadiusKm;

    public UserResponse(Long id, String name, String location, String role, String phone, String specialty,
                        String bio, String profilePhotoUrl, Boolean isAvailable,
                        Boolean isPriorityListingActive, Boolean hasExtendedPortfolio, Boolean isVerifiedBadge,
                        Boolean hasClientLoyaltyTools, Boolean hasEarningsAnalytics,
                        java.time.LocalDateTime priorityListingExpiresAt,
                        java.time.LocalDateTime clientLoyaltyToolsExpiresAt,
                        java.time.LocalDateTime earningsAnalyticsExpiresAt,
                        Double workLatitude, Double workLongitude, Integer serviceRadiusKm) {
        this.id = id;
        this.name = name;
        this.location = location;
        this.role = role;
        this.phone = phone;
        this.specialty = specialty;
        this.bio = bio;
        this.profilePhotoUrl = profilePhotoUrl;
        this.isAvailable = isAvailable;
        this.isPriorityListingActive = isPriorityListingActive;
        this.hasExtendedPortfolio = hasExtendedPortfolio;
        this.isVerifiedBadge = isVerifiedBadge;
        this.hasClientLoyaltyTools = hasClientLoyaltyTools;
        this.hasEarningsAnalytics = hasEarningsAnalytics;
        this.priorityListingExpiresAt = priorityListingExpiresAt;
        this.clientLoyaltyToolsExpiresAt = clientLoyaltyToolsExpiresAt;
        this.earningsAnalyticsExpiresAt = earningsAnalyticsExpiresAt;
        this.workLatitude = workLatitude;
        this.workLongitude = workLongitude;
        this.serviceRadiusKm = serviceRadiusKm;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getProfilePhotoUrl() { return profilePhotoUrl; }
    public void setProfilePhotoUrl(String profilePhotoUrl) { this.profilePhotoUrl = profilePhotoUrl; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getSpecialty() { return specialty; }
    public void setSpecialty(String specialty) { this.specialty = specialty; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public Boolean getIsAvailable() { return isAvailable; }
    public void setIsAvailable(Boolean isAvailable) { this.isAvailable = isAvailable; }

    public Boolean getIsPriorityListingActive() { return isPriorityListingActive; }
    public void setIsPriorityListingActive(Boolean isPriorityListingActive) { this.isPriorityListingActive = isPriorityListingActive; }

    public Boolean getHasExtendedPortfolio() { return hasExtendedPortfolio; }
    public void setHasExtendedPortfolio(Boolean hasExtendedPortfolio) { this.hasExtendedPortfolio = hasExtendedPortfolio; }

    public Boolean getIsVerifiedBadge() { return isVerifiedBadge; }
    public void setIsVerifiedBadge(Boolean isVerifiedBadge) { this.isVerifiedBadge = isVerifiedBadge; }

    public Boolean getHasClientLoyaltyTools() { return hasClientLoyaltyTools; }
    public void setHasClientLoyaltyTools(Boolean hasClientLoyaltyTools) { this.hasClientLoyaltyTools = hasClientLoyaltyTools; }

    public Boolean getHasEarningsAnalytics() { return hasEarningsAnalytics; }
    public void setHasEarningsAnalytics(Boolean hasEarningsAnalytics) { this.hasEarningsAnalytics = hasEarningsAnalytics; }

    public java.time.LocalDateTime getPriorityListingExpiresAt() { return priorityListingExpiresAt; }
    public void setPriorityListingExpiresAt(java.time.LocalDateTime priorityListingExpiresAt) { this.priorityListingExpiresAt = priorityListingExpiresAt; }

    public java.time.LocalDateTime getClientLoyaltyToolsExpiresAt() { return clientLoyaltyToolsExpiresAt; }
    public void setClientLoyaltyToolsExpiresAt(java.time.LocalDateTime clientLoyaltyToolsExpiresAt) { this.clientLoyaltyToolsExpiresAt = clientLoyaltyToolsExpiresAt; }

    public java.time.LocalDateTime getEarningsAnalyticsExpiresAt() { return earningsAnalyticsExpiresAt; }
    public void setEarningsAnalyticsExpiresAt(java.time.LocalDateTime earningsAnalyticsExpiresAt) { this.earningsAnalyticsExpiresAt = earningsAnalyticsExpiresAt; }

    public Double getWorkLatitude() { return workLatitude; }
    public void setWorkLatitude(Double workLatitude) { this.workLatitude = workLatitude; }

    public Double getWorkLongitude() { return workLongitude; }
    public void setWorkLongitude(Double workLongitude) { this.workLongitude = workLongitude; }

    public Integer getServiceRadiusKm() { return serviceRadiusKm; }
    public void setServiceRadiusKm(Integer serviceRadiusKm) { this.serviceRadiusKm = serviceRadiusKm; }
}