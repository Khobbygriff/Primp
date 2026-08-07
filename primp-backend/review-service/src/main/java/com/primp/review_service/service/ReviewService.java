package com.primp.review_service.service;

import com.primp.review_service.dto.RatingSummary;
import com.primp.review_service.dto.ReviewRequest;
import com.primp.review_service.dto.ReviewResponse;
import com.primp.review_service.model.Review;
import com.primp.review_service.repository.ReviewRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;

    public ReviewService(ReviewRepository reviewRepository) {
        this.reviewRepository = reviewRepository;
    }

    public ReviewResponse submitReview(Long reviewerId, String reviewerRole, ReviewRequest request) {
        // Prevent duplicate reviews
        reviewRepository.findByBookingIdAndReviewerId(
                        request.getBookingId(), reviewerId)
                .ifPresent(r -> {
                    throw new RuntimeException("You have already reviewed this booking");
                });

        // Validate rating range
        if (request.getRating() < 1 || request.getRating() > 5) {
            throw new RuntimeException("Rating must be between 1 and 5");
        }

        Review review = new Review();
        review.setBookingId(request.getBookingId());
        review.setReviewerId(reviewerId);
        review.setRevieweeId(request.getRevieweeId());
        review.setReviewerRole(Review.ReviewerRole.valueOf(
            reviewerRole.toUpperCase()));
        review.setRating(request.getRating());
        review.setComment(request.getComment());

        return new ReviewResponse(reviewRepository.save(review));
    }

    public List<ReviewResponse> getReviewsForUser(Long userId) {
        return reviewRepository.findByRevieweeId(userId)
                .stream()
                .map(ReviewResponse::new)
                .collect(Collectors.toList());
    }

    public List<ReviewResponse> getReviewsByUser(Long userId) {
        return reviewRepository.findByReviewerId(userId)
                .stream()
                .map(ReviewResponse::new)
                .collect(Collectors.toList());
    }

    public RatingSummary getRatingSummary(Long userId) {
        Double average = reviewRepository.calculateAverageRating(userId);
        Long count = reviewRepository.countReviews(userId);
        return new RatingSummary(userId, average, count);
    }
}