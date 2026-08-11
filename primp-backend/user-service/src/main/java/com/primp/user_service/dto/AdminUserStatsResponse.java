package com.primp.user_service.dto;

import java.time.LocalDateTime;

public class AdminUserStatsResponse {
    private long totalUsers;
    private long totalClients;
    private long totalProfessionals;
    private long totalAdmins;
    private long suspendedUsers;
    private long newUsersLast30Days;
    private long premiumPurchasesLast30Days;
    private double premiumRevenueLast30Days;
    private LocalDateTime generatedAt;

    public long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }
    public long getTotalClients() { return totalClients; }
    public void setTotalClients(long totalClients) { this.totalClients = totalClients; }
    public long getTotalProfessionals() { return totalProfessionals; }
    public void setTotalProfessionals(long totalProfessionals) { this.totalProfessionals = totalProfessionals; }
    public long getTotalAdmins() { return totalAdmins; }
    public void setTotalAdmins(long totalAdmins) { this.totalAdmins = totalAdmins; }
    public long getSuspendedUsers() { return suspendedUsers; }
    public void setSuspendedUsers(long suspendedUsers) { this.suspendedUsers = suspendedUsers; }
    public long getNewUsersLast30Days() { return newUsersLast30Days; }
    public void setNewUsersLast30Days(long newUsersLast30Days) { this.newUsersLast30Days = newUsersLast30Days; }
    public long getPremiumPurchasesLast30Days() { return premiumPurchasesLast30Days; }
    public void setPremiumPurchasesLast30Days(long premiumPurchasesLast30Days) { this.premiumPurchasesLast30Days = premiumPurchasesLast30Days; }
    public double getPremiumRevenueLast30Days() { return premiumRevenueLast30Days; }
    public void setPremiumRevenueLast30Days(double premiumRevenueLast30Days) { this.premiumRevenueLast30Days = premiumRevenueLast30Days; }
    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }
}