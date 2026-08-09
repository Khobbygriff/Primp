package com.primp.user_service.service;

import com.primp.user_service.dto.AdminUserResponse;
import com.primp.user_service.model.User;
import com.primp.user_service.repository.PremiumPurchaseRepository;
import com.primp.user_service.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PremiumPurchaseRepository premiumPurchaseRepository;

    private AdminUserService adminUserService;

    @BeforeEach
    void setUp() {
        adminUserService = new AdminUserService(userRepository, premiumPurchaseRepository);
    }

    @Test
    void suspendUserRequiresANonBlankReason() {
        assertThrows(ResponseStatusException.class, () -> adminUserService.suspendUser(1L, "  "));
        assertThrows(ResponseStatusException.class, () -> adminUserService.suspendUser(1L, null));
    }

    @Test
    void suspendUserSetsSuspensionFieldsAndHidesFromDiscovery() {
        User user = new User();
        user.setId(1L);
        user.setRole(User.Role.PROFESSIONAL);
        user.setIsAvailable(true);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        AdminUserResponse response = adminUserService.suspendUser(1L, "Repeated no-shows");

        assertTrue(response.getIsSuspended());
        assertEquals("Repeated no-shows", response.getSuspendedReason());
        assertNotNull(response.getSuspendedAt());
        assertFalse(user.getIsAvailable(), "Suspending should also hide the account from discovery");
    }

    @Test
    void suspendUserThrowsWhenUserNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResponseStatusException.class, () -> adminUserService.suspendUser(99L, "reason"));
    }

    @Test
    void reinstateClearsSuspensionFieldsButLeavesAvailabilityUntouched() {
        User user = new User();
        user.setId(1L);
        user.setRole(User.Role.PROFESSIONAL); // ADD THIS
        user.setIsSuspended(true);
        user.setIsAvailable(false);

        when(userRepository.findById(1L))
                .thenReturn(Optional.of(user));

        when(userRepository.save(any(User.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        AdminUserResponse response = adminUserService.reinstateUser(1L);

        assertFalse(response.getIsSuspended());
        assertNull(response.getSuspendedAt());
        assertNull(response.getSuspendedReason());
        assertFalse(
                user.getIsAvailable(),
                "Reinstating should not silently re-enable listing visibility"
        );
    }

    @Test
    void getStatsAggregatesCountsFromBothRepositories() {
        when(userRepository.count()).thenReturn(100L);
        when(userRepository.countByRole(User.Role.CLIENT)).thenReturn(70L);
        when(userRepository.countByRole(User.Role.PROFESSIONAL)).thenReturn(28L);
        when(userRepository.countByRole(User.Role.ADMIN)).thenReturn(2L);
        when(userRepository.countByIsSuspendedTrue()).thenReturn(3L);
        when(userRepository.countByCreatedAtAfter(any())).thenReturn(12L);
        when(premiumPurchaseRepository.countByPurchasedAtAfter(any())).thenReturn(5L);
        when(premiumPurchaseRepository.sumAmountSince(any())).thenReturn(225.0);

        var stats = adminUserService.getStats();

        assertEquals(100L, stats.getTotalUsers());
        assertEquals(70L, stats.getTotalClients());
        assertEquals(3L, stats.getSuspendedUsers());
        assertEquals(225.0, stats.getPremiumRevenueLast30Days());
        assertNotNull(stats.getGeneratedAt());
    }
}