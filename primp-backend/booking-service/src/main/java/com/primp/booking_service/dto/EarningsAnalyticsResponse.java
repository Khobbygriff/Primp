package com.primp.booking_service.dto;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Earnings Analytics — "Personal income dashboard showing revenue by
 * month, service type, average booking value... and performance trends over
 * time." Built entirely from data already persisted on Booking (agreedPrice,
 * primpFee, serviceType, updatedAt) once a booking reaches CLOSED.
 */
public class EarningsAnalyticsResponse {
    private Long professionalId;
    private int totalClosedBookings;
    private double totalRevenue;
    private double totalPrimpFees;
    private double totalNetEarnings;
    private double averageBookingValue;
    private Map<String, Double> revenueByMonth = new LinkedHashMap<>();
    private Map<String, Integer> bookingCountByMonth = new LinkedHashMap<>();
    private Map<String, Double> revenueByServiceType = new LinkedHashMap<>();
    private Map<String, Integer> bookingCountByServiceType = new LinkedHashMap<>();

    public Long getProfessionalId() { return professionalId; }
    public void setProfessionalId(Long professionalId) { this.professionalId = professionalId; }

    public int getTotalClosedBookings() { return totalClosedBookings; }
    public void setTotalClosedBookings(int totalClosedBookings) { this.totalClosedBookings = totalClosedBookings; }

    public double getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(double totalRevenue) { this.totalRevenue = totalRevenue; }

    public double getTotalPrimpFees() { return totalPrimpFees; }
    public void setTotalPrimpFees(double totalPrimpFees) { this.totalPrimpFees = totalPrimpFees; }

    public double getTotalNetEarnings() { return totalNetEarnings; }
    public void setTotalNetEarnings(double totalNetEarnings) { this.totalNetEarnings = totalNetEarnings; }

    public double getAverageBookingValue() { return averageBookingValue; }
    public void setAverageBookingValue(double averageBookingValue) { this.averageBookingValue = averageBookingValue; }

    public Map<String, Double> getRevenueByMonth() { return revenueByMonth; }
    public void setRevenueByMonth(Map<String, Double> revenueByMonth) { this.revenueByMonth = revenueByMonth; }

    public Map<String, Integer> getBookingCountByMonth() { return bookingCountByMonth; }
    public void setBookingCountByMonth(Map<String, Integer> bookingCountByMonth) { this.bookingCountByMonth = bookingCountByMonth; }

    public Map<String, Double> getRevenueByServiceType() { return revenueByServiceType; }
    public void setRevenueByServiceType(Map<String, Double> revenueByServiceType) { this.revenueByServiceType = revenueByServiceType; }

    public Map<String, Integer> getBookingCountByServiceType() { return bookingCountByServiceType; }
    public void setBookingCountByServiceType(Map<String, Integer> bookingCountByServiceType) { this.bookingCountByServiceType = bookingCountByServiceType; }
}