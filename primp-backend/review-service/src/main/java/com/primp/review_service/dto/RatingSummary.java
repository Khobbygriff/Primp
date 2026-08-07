package com.primp.review_service.dto;

public class RatingSummary {
    private Long userId;
    private Double averageRating;
    private Long totalReviews;

    public RatingSummary(Long userId, Double averageRating, Long totalReviews) {
        this.userId = userId;
        this.averageRating = averageRating != null
                ? Math.round(averageRating * 10.0) / 10.0
                : 0.0;
        this.totalReviews = totalReviews;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Double getAverageRating() { return averageRating; }
    public void setAverageRating(Double averageRating) { this.averageRating = averageRating; }

    public Long getTotalReviews() { return totalReviews; }
    public void setTotalReviews(Long totalReviews) { this.totalReviews = totalReviews; }
}