package com.primp.booking_service.repository;

import com.primp.booking_service.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByClientId(Long clientId);
    List<Booking> findByProfessionalId(Long professionalId);
    List<Booking> findByProfessionalIdAndStatus(Long professionalId, Booking.Status status);
    List<Booking> findByClientIdAndStatus(Long clientId, Booking.Status status);
    Optional<Booking> findByPaymentReference(String paymentReference);

    @org.springframework.data.jpa.repository.Query(
            "SELECT b FROM Booking b WHERE " +
                    "(:search IS NULL OR LOWER(b.paymentReference) LIKE LOWER(CONCAT('%', :search, '%')) " +
                    "  OR CAST(b.id AS string) = :search) " +
                    "AND (:status IS NULL OR b.status = :status) " +
                    "AND (:hasReference IS NULL " +
                    "     OR (:hasReference = TRUE AND b.paymentReference IS NOT NULL) " +
                    "     OR (:hasReference = FALSE AND b.paymentReference IS NULL)) " +
                    "AND (:userId IS NULL OR b.clientId = :userId OR b.professionalId = :userId)")
    org.springframework.data.domain.Page<Booking> search(
            @org.springframework.data.repository.query.Param("search") String search,
            @org.springframework.data.repository.query.Param("status") Booking.Status status,
            @org.springframework.data.repository.query.Param("hasReference") Boolean hasReference,
            @org.springframework.data.repository.query.Param("userId") Long userId,
            org.springframework.data.domain.Pageable pageable);
}