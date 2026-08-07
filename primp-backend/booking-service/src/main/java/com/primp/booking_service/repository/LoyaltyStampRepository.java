package com.primp.booking_service.repository;

import com.primp.booking_service.model.LoyaltyStamp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoyaltyStampRepository extends JpaRepository<LoyaltyStamp, Long> {
    Optional<LoyaltyStamp> findByProfessionalIdAndClientId(Long professionalId, Long clientId);
    List<LoyaltyStamp> findByProfessionalIdOrderByStampCountDesc(Long professionalId);
}