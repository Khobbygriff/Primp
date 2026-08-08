package com.primp.user_service.repository;

import com.primp.user_service.model.PremiumPurchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PremiumPurchaseRepository extends JpaRepository<PremiumPurchase, Long> {
    Optional<PremiumPurchase> findByPaymentReference(String paymentReference);

    @org.springframework.data.jpa.repository.Query(
            "SELECT p FROM PremiumPurchase p WHERE " +
                    "(:search IS NULL OR LOWER(p.paymentReference) LIKE LOWER(CONCAT('%', :search, '%'))) " +
                    "AND (:feature IS NULL OR p.feature = :feature)")
    org.springframework.data.domain.Page<PremiumPurchase> search(
            @org.springframework.data.repository.query.Param("search") String search,
            @org.springframework.data.repository.query.Param("feature") String feature,
            org.springframework.data.domain.Pageable pageable);
}