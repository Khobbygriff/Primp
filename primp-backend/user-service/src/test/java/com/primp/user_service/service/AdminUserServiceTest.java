package com.primp.user_service.service;

import com.primp.user_service.dto.AdminUserResponse;
import com.primp.user_service.model.User;
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

    private AdminUserService adminUserService;

    @BeforeEach
    void setUp() {
        adminUserService = new AdminUserService(userRepository);
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
        user.setIsSuspended(true);
        user.setIsAvailable(false);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        AdminUserResponse response = adminUserService.reinstateUser(1L);

        assertFalse(response.getIsSuspended());
        assertNull(response.getSuspendedAt());
        assertNull(response.getSuspendedReason());
        assertFalse(user.getIsAvailable(), "Reinstating should not silently re-enable listing visibility");
    }
}