package com.primp.booking_service.service;

import com.primp.booking_service.client.UserClient;
import com.primp.booking_service.dto.EarningsAnalyticsResponse;
import com.primp.booking_service.model.Booking;
import com.primp.booking_service.repository.BookingRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
public class AnalyticsService {

    private static final DateTimeFormatter MONTH_KEY_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM");

    private final BookingRepository bookingRepository;
    private final UserClient userClient;

    public AnalyticsService(BookingRepository bookingRepository, UserClient userClient) {
        this.bookingRepository = bookingRepository;
        this.userClient = userClient;
    }

    public EarningsAnalyticsResponse getEarningsAnalytics(Long professionalId, Long authenticatedUserId) {
        if (!professionalId.equals(authenticatedUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized");
        }

        if (!userClient.hasEarningsAnalytics(professionalId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Unlock Earnings Analytics to view your income dashboard");
        }

        List<Booking> closedBookings = bookingRepository.findByProfessionalIdAndStatus(professionalId, Booking.Status.CLOSED);

        EarningsAnalyticsResponse response = new EarningsAnalyticsResponse();
        response.setProfessionalId(professionalId);
        response.setTotalClosedBookings(closedBookings.size());

        if (closedBookings.isEmpty()) {
            return response;
        }

        double totalRevenue = closedBookings.stream()
                .mapToDouble(b -> b.getAgreedPrice() != null ? b.getAgreedPrice() : 0.0)
                .sum();
        double totalFees = closedBookings.stream()
                .mapToDouble(b -> b.getPrimpFee() != null ? b.getPrimpFee() : 0.0)
                .sum();

        response.setTotalRevenue(round2(totalRevenue));
        response.setTotalPrimpFees(round2(totalFees));
        response.setTotalNetEarnings(round2(totalRevenue - totalFees));
        response.setAverageBookingValue(round2(totalRevenue / closedBookings.size()));

        // Revenue and volume trend by month, based on when the booking was
        // actually closed (updatedAt is touched on every status transition,
        // including the CLOSED transition itself).
        Map<String, Double> revenueByMonth = new TreeMap<>();
        Map<String, Integer> countByMonth = new TreeMap<>();
        for (Booking booking : closedBookings) {
            if (booking.getUpdatedAt() == null) continue;
            String monthKey = booking.getUpdatedAt().format(MONTH_KEY_FORMAT);
            double price = booking.getAgreedPrice() != null ? booking.getAgreedPrice() : 0.0;
            revenueByMonth.merge(monthKey, price, Double::sum);
            countByMonth.merge(monthKey, 1, Integer::sum);
        }
        revenueByMonth.replaceAll((k, v) -> round2(v));
        response.setRevenueByMonth(new LinkedHashMap<>(revenueByMonth));
        response.setBookingCountByMonth(new LinkedHashMap<>(countByMonth));

        // Revenue and volume by service type, sorted by revenue descending
        // so the professional immediately sees their most valuable service.
        Map<String, Double> revenueByService = new LinkedHashMap<>();
        Map<String, Integer> countByService = new LinkedHashMap<>();
        closedBookings.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        b -> b.getServiceType() != null ? b.getServiceType() : "Other",
                        java.util.stream.Collectors.summingDouble(b -> b.getAgreedPrice() != null ? b.getAgreedPrice() : 0.0)))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .forEach(entry -> revenueByService.put(entry.getKey(), round2(entry.getValue())));

        closedBookings.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        b -> b.getServiceType() != null ? b.getServiceType() : "Other",
                        java.util.stream.Collectors.counting()))
                .forEach((key, value) -> countByService.put(key, value.intValue()));

        response.setRevenueByServiceType(revenueByService);
        response.setBookingCountByServiceType(countByService);

        return response;
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}