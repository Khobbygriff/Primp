package com.primp.review_service.controller;

import com.primp.review_service.dto.RatingSummary;
import com.primp.review_service.dto.ReviewRequest;
import com.primp.review_service.dto.ReviewResponse;
import com.primp.review_service.service.ReviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    public ResponseEntity<ReviewResponse> submitReview(
            @RequestHeader("X-User-Id") Long reviewerId,
            @RequestHeader("X-User-Role") String reviewerRole,
            @RequestBody ReviewRequest request) {
        return ResponseEntity.ok(reviewService.submitReview(reviewerId, reviewerRole, request));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ReviewResponse>> getReviewsForUser(
            @RequestHeader("X-User-Id") Long authenticatedUserId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long userId) {
        if (!authenticatedUserId.equals(userId) && !"ADMIN".equals(role)) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "Unauthorized");
        }
        return ResponseEntity.ok(reviewService.getReviewsForUser(userId));
    }

    @GetMapping("/by/{userId}")
    public ResponseEntity<List<ReviewResponse>> getReviewsByUser(
            @RequestHeader("X-User-Id") Long authenticatedUserId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long userId) {
        if (!authenticatedUserId.equals(userId) && !"ADMIN".equals(role)) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "Unauthorized");
        }
        return ResponseEntity.ok(reviewService.getReviewsByUser(userId));
    }

    @GetMapping("/summary/{userId}")
    public ResponseEntity<RatingSummary> getRatingSummary(
            @RequestHeader("X-User-Id") Long authenticatedUserId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long userId) {
        if (!authenticatedUserId.equals(userId) && !"ADMIN".equals(role)) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "Unauthorized");
        }
        return ResponseEntity.ok(reviewService.getRatingSummary(userId));
    }
}