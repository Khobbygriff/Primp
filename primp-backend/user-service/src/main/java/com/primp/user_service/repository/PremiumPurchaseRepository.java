package com.primp.user_service.repository;

import com.primp.user_service.model.PremiumPurchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PremiumPurchaseRepository extends JpaRepository<PremiumPurchase, Long> {
    Optional<PremiumPurchase> findByPaymentReference(String paymentReference);
}