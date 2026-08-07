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
}