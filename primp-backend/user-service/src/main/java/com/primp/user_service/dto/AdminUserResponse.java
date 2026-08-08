package com.primp.user_service.dto;

import com.primp.user_service.model.User;
import java.time.LocalDateTime;

public class AdminUserResponse {
    private Long id;
    private String name;
    private String email;
    private String location;
    private String role;
    private String phone;
    private String specialty;
    private String bio;
    private String profilePhotoUrl;
    private Boolean isAvailable;
    private Boolean isSuspended;
    private LocalDateTime suspendedAt;
    private String suspendedReason;
    private LocalDateTime createdAt;

    public AdminUserResponse(User user) {
        this.id = user.getId();
        this.name = user.getName();
        this.email = user.getEmail();
        this.location = user.getLocation();
        this.role = user.getRole().name();
        this.phone = user.getPhone();
        this.specialty = user.getSpecialty();
        this.bio = user.getBio();
        this.profilePhotoUrl = user.getProfilePhotoUrl();
        this.isAvailable = user.getIsAvailable();
        this.isSuspended = user.getIsSuspended();
        this.suspendedAt = user.getSuspendedAt();
        this.suspendedReason = user.getSuspendedReason();
        this.createdAt = user.getCreatedAt();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
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
    public String getProfilePhotoUrl() { return profilePhotoUrl; }
    public void setProfilePhotoUrl(String profilePhotoUrl) { this.profilePhotoUrl = profilePhotoUrl; }
    public Boolean getIsAvailable() { return isAvailable; }
    public void setIsAvailable(Boolean isAvailable) { this.isAvailable = isAvailable; }
    public Boolean getIsSuspended() { return isSuspended; }
    public void setIsSuspended(Boolean isSuspended) { this.isSuspended = isSuspended; }
    public LocalDateTime getSuspendedAt() { return suspendedAt; }
    public void setSuspendedAt(LocalDateTime suspendedAt) { this.suspendedAt = suspendedAt; }
    public String getSuspendedReason() { return suspendedReason; }
    public void setSuspendedReason(String suspendedReason) { this.suspendedReason = suspendedReason; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}