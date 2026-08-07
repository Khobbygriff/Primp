package com.primp.user_service.dto;

import com.primp.user_service.model.PortfolioPost;
import java.time.LocalDateTime;

public class PortfolioPostResponse {
    private Long id;
    private Long professionalId;
    private String professionalName;
    private String specialty;
    private String mediaType;
    private String imageUrl;
    private String styleTag;
    private String caption;
    private LocalDateTime createdAt;
    private String professionalPhotoUrl;

    public PortfolioPostResponse(PortfolioPost post, String professionalName, String specialty, String professionalPhotoUrl) {
        this.id = post.getId();
        this.professionalId = post.getProfessionalId();
        this.professionalName = professionalName;
        this.specialty = specialty;
        this.professionalPhotoUrl = professionalPhotoUrl;
        this.imageUrl = post.getImageUrl();
        this.styleTag = post.getStyleTag();
        this.caption = post.getCaption();
        this.mediaType = post.getMediaType();
        this.createdAt = post.getCreatedAt();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getProfessionalPhotoUrl() { return professionalPhotoUrl; }
    public void setProfessionalPhotoUrl(String professionalPhotoUrl) { this.professionalPhotoUrl = professionalPhotoUrl; }

    public Long getProfessionalId() { return professionalId; }
    public void setProfessionalId(Long professionalId) { this.professionalId = professionalId; }

    public String getProfessionalName() { return professionalName; }
    public void setProfessionalName(String professionalName) { this.professionalName = professionalName; }

    public String getSpecialty() { return specialty; }
    public void setSpecialty(String specialty) { this.specialty = specialty; }

    public String getMediaType() { return mediaType; }
    public void setMediaType(String mediaType) { this.mediaType = mediaType; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getStyleTag() { return styleTag; }
    public void setStyleTag(String styleTag) { this.styleTag = styleTag; }

    public String getCaption() { return caption; }
    public void setCaption(String caption) { this.caption = caption; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}