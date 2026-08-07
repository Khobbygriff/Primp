package com.primp.user_service.dto;

public class AuthResponse {
    private Long id;
    private String token;
    private String role;
    private String name;
    private String profilePhotoUrl;

    public AuthResponse(Long id, String token, String role, String name, String profilePhotoUrl) {
        this.id = id;
        this.token = token;
        this.role = role;
        this.name = name;
        this.profilePhotoUrl = profilePhotoUrl;
    }

    public String getProfilePhotoUrl() { return profilePhotoUrl; }
    public void setProfilePhotoUrl(String profilePhotoUrl) { this.profilePhotoUrl = profilePhotoUrl; }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}