package com.primp.user_service.dto;

public class UpdateProfileRequest {
    private String specialty;
    private String bio;
    private String location;
    private String phone;
    private String profilePhotoUrl;
    private Boolean isAvailable;
    private Double workLatitude;
    private Double workLongitude;
    private Integer serviceRadiusKm;

    public String getProfilePhotoUrl() { return profilePhotoUrl; }
    public void setProfilePhotoUrl(String profilePhotoUrl) { this.profilePhotoUrl = profilePhotoUrl; }

    public String getSpecialty() { return specialty; }
    public void setSpecialty(String specialty) { this.specialty = specialty; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public Boolean getIsAvailable() { return isAvailable; }
    public void setIsAvailable(Boolean isAvailable) { this.isAvailable = isAvailable; }

    public Double getWorkLatitude() { return workLatitude; }
    public void setWorkLatitude(Double workLatitude) { this.workLatitude = workLatitude; }

    public Double getWorkLongitude() { return workLongitude; }
    public void setWorkLongitude(Double workLongitude) { this.workLongitude = workLongitude; }

    public Integer getServiceRadiusKm() { return serviceRadiusKm; }
    public void setServiceRadiusKm(Integer serviceRadiusKm) { this.serviceRadiusKm = serviceRadiusKm; }
}