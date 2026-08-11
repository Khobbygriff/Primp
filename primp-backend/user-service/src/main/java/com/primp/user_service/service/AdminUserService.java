package com.primp.user_service.service;

import com.primp.user_service.client.NotificationClient;
import com.primp.user_service.dto.AdminUserResponse;
import com.primp.user_service.dto.AdminUserStatsResponse;
import com.primp.user_service.dto.PageResponse;
import com.primp.user_service.model.User;
import com.primp.user_service.repository.UserRepository;
import com.primp.user_service.repository.PremiumPurchaseRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminUserService {

    private final UserRepository userRepository;
    private final PremiumPurchaseRepository premiumPurchaseRepository;
    private final NotificationClient notificationClient;

    public AdminUserService(UserRepository userRepository,
                            PremiumPurchaseRepository premiumPurchaseRepository,
                            NotificationClient notificationClient) {
        this.userRepository = userRepository;
        this.premiumPurchaseRepository = premiumPurchaseRepository;
        this.notificationClient = notificationClient;
    }

    public PageResponse<AdminUserResponse> listUsers(String search, String roleParam,
                                                     boolean includeSuspended, int page, int pageSize) {
        User.Role role = null;
        if (roleParam != null && !roleParam.isBlank()) {
            try {
                role = User.Role.valueOf(roleParam.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown role: " + roleParam);
            }
        }

        Pageable pageable = PageRequest.of(Math.max(page - 1, 0), pageSize,
                Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<User> result = userRepository.searchUsers(
                (search == null || search.isBlank()) ? "" : search.trim(),
                role, includeSuspended, pageable);

        List<AdminUserResponse> items = result.getContent().stream()
                .map(AdminUserResponse::new)
                .collect(Collectors.toList());

        return new PageResponse<>(items, page, pageSize, result.getTotalElements(), result.getTotalPages());
    }

    public AdminUserResponse getUserDetail(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return new AdminUserResponse(user);
    }

    public AdminUserResponse suspendUser(Long userId, String reason) {
        if (reason == null || reason.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A suspension reason is required");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        user.setIsSuspended(true);
        user.setSuspendedAt(LocalDateTime.now());
        user.setSuspendedReason(reason.trim());
        // Also hide from discovery immediately — mirrors the isAvailable
        // filter that UserService#getProfessionals already applies.
        user.setIsAvailable(false);

        AdminUserResponse response = new AdminUserResponse(userRepository.save(user));

        notificationClient.sendNotification(
                userId, "ACCOUNT_SUSPENDED", "Your account has been suspended",
                "Reason: " + reason.trim() + ". If you believe this was a mistake, contact support to request a review.");

        return response;
    }

    public AdminUserResponse reinstateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        user.setIsSuspended(false);
        user.setSuspendedAt(null);
        user.setSuspendedReason(null);

        boolean isProfessional = user.getRole() == User.Role.PROFESSIONAL;

        // Clients have no visibility toggle of their own, so reinstating a
        // client must restore isAvailable directly. Professionals DO have
        // one (Edit Profile), so theirs stays off deliberately — see (4) below.
        if (!isProfessional) {
            user.setIsAvailable(true);
        }

        AdminUserResponse response = new AdminUserResponse(userRepository.save(user));

        String body = isProfessional
                ? "Your account is no longer suspended. Note: your profile stays hidden from clients until you re-enable visibility in Edit Profile."
                : "Your account is no longer suspended. You can book services again.";

        notificationClient.sendNotification(userId, "ACCOUNT_REINSTATED", "Your account has been reinstated", body);

        return response;
    }

    public AdminUserStatsResponse getStats() {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);

        AdminUserStatsResponse stats = new AdminUserStatsResponse();
        stats.setTotalUsers(userRepository.count());
        stats.setTotalClients(userRepository.countByRole(User.Role.CLIENT));
        stats.setTotalProfessionals(userRepository.countByRole(User.Role.PROFESSIONAL));
        stats.setTotalAdmins(userRepository.countByRole(User.Role.ADMIN));
        stats.setSuspendedUsers(userRepository.countByIsSuspendedTrue());
        stats.setNewUsersLast30Days(userRepository.countByCreatedAtAfter(thirtyDaysAgo));
        stats.setPremiumPurchasesLast30Days(premiumPurchaseRepository.countByPurchasedAtAfter(thirtyDaysAgo));
        stats.setPremiumRevenueLast30Days(premiumPurchaseRepository.sumAmountSince(thirtyDaysAgo));
        stats.setGeneratedAt(LocalDateTime.now());
        return stats;
    }
}