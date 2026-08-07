package com.primp.review_service.repository;

import com.primp.review_service.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByRevieweeId(Long revieweeId);
    List<Review> findByReviewerId(Long reviewerId);
    Optional<Review> findByBookingIdAndReviewerId(Long bookingId, Long reviewerId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.revieweeId = :revieweeId")
    Double calculateAverageRating(Long revieweeId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.revieweeId = :revieweeId")
    Long countReviews(Long revieweeId);
}