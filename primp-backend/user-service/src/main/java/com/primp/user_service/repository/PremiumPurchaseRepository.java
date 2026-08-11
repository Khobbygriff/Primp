package com.primp.user_service.repository;

import com.primp.user_service.model.PremiumPurchase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PremiumPurchaseRepository extends JpaRepository<PremiumPurchase, Long> {
    Optional<PremiumPurchase> findByPaymentReference(String paymentReference);
    long countByPurchasedAtAfter(java.time.LocalDateTime threshold);

    @org.springframework.data.jpa.repository.Query(
            "SELECT COALESCE(SUM(p.amount), 0) FROM PremiumPurchase p WHERE p.purchasedAt >= :threshold")
    double sumAmountSince(@org.springframework.data.repository.query.Param("threshold") java.time.LocalDateTime threshold);

    @Query("SELECT p FROM PremiumPurchase p WHERE " +
            "(:search = '' OR LOWER(p.paymentReference) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND (:feature IS NULL OR p.feature = :feature)")
    Page<PremiumPurchase> search(@Param("search") String search, @Param("feature") String feature,
                                 Pageable pageable);
}