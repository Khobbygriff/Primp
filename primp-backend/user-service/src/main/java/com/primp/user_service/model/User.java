package com.primp.user_service.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "profile_photo_url")
    private String profilePhotoUrl;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    private String phone;
    private String location;
    private String specialty;

    @Column(length = 500)
    private String bio;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (isAvailable == null) isAvailable = true;
        if (isPriorityListingActive == null) isPriorityListingActive = false;
        if (hasExtendedPortfolio == null) hasExtendedPortfolio = false;
        if (isVerifiedBadge == null) isVerifiedBadge = false;
        if (hasClientLoyaltyTools == null) hasClientLoyaltyTools = false;
        if (hasEarningsAnalytics == null) hasEarningsAnalytics = false;
        if (serviceRadiusKm == null) serviceRadiusKm = 15;
    }

    @Column(name = "is_available")
    private Boolean isAvailable = true;

    @Column(name = "is_priority_listing_active")
    private Boolean isPriorityListingActive = false;

    @Column(name = "has_extended_portfolio")
    private Boolean hasExtendedPortfolio = false;

    @Column(name = "is_verified_badge")
    private Boolean isVerifiedBadge = false;

    @Column(name = "has_client_loyalty_tools")
    private Boolean hasClientLoyaltyTools = false;

    @Column(name = "has_earnings_analytics")
    private Boolean hasEarningsAnalytics = false;

    @Column(name = "priority_listing_expires_at")
    private LocalDateTime priorityListingExpiresAt;

    @Column(name = "client_loyalty_tools_expires_at")
    private LocalDateTime clientLoyaltyToolsExpiresAt;

    @Column(name = "earnings_analytics_expires_at")
    private LocalDateTime earningsAnalyticsExpiresAt;

    // Precise work location for map discovery + proximity filtering.
    // Nullable — professionals who haven't set a pin yet fall back to
    // text-based location matching on the mobile client.
    @Column(name = "work_latitude")
    private Double workLatitude;

    @Column(name = "work_longitude")
    private Double workLongitude;

    // How far (in km) this professional is willing to travel / considers
    // themselves discoverable from their work location. Defaults to 15km.
    @Column(name = "service_radius_km")
    private Integer serviceRadiusKm = 15;

    public enum Role {
        PROFESSIONAL, CLIENT, ADMIN
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getProfilePhotoUrl() { return profilePhotoUrl; }
    public void setProfilePhotoUrl(String profilePhotoUrl) { this.profilePhotoUrl = profilePhotoUrl; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getSpecialty() { return specialty; }
    public void setSpecialty(String specialty) { this.specialty = specialty; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

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

    public LocalDateTime getPriorityListingExpiresAt() { return priorityListingExpiresAt; }
    public void setPriorityListingExpiresAt(LocalDateTime priorityListingExpiresAt) { this.priorityListingExpiresAt = priorityListingExpiresAt; }

    public LocalDateTime getClientLoyaltyToolsExpiresAt() { return clientLoyaltyToolsExpiresAt; }
    public void setClientLoyaltyToolsExpiresAt(LocalDateTime clientLoyaltyToolsExpiresAt) { this.clientLoyaltyToolsExpiresAt = clientLoyaltyToolsExpiresAt; }

    public LocalDateTime getEarningsAnalyticsExpiresAt() { return earningsAnalyticsExpiresAt; }
    public void setEarningsAnalyticsExpiresAt(LocalDateTime earningsAnalyticsExpiresAt) { this.earningsAnalyticsExpiresAt = earningsAnalyticsExpiresAt; }

    public Double getWorkLatitude() { return workLatitude; }
    public void setWorkLatitude(Double workLatitude) { this.workLatitude = workLatitude; }

    public Double getWorkLongitude() { return workLongitude; }
    public void setWorkLongitude(Double workLongitude) { this.workLongitude = workLongitude; }

    public Integer getServiceRadiusKm() { return serviceRadiusKm; }
    public void setServiceRadiusKm(Integer serviceRadiusKm) { this.serviceRadiusKm = serviceRadiusKm; }
}