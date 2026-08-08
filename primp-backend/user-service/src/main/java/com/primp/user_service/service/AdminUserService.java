package com.primp.user_service.service;

import com.primp.user_service.dto.AdminUserResponse;
import com.primp.user_service.dto.PageResponse;
import com.primp.user_service.model.User;
import com.primp.user_service.repository.UserRepository;
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

    public AdminUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
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
                (search == null || search.isBlank()) ? null : search.trim(),
                role,
                includeSuspended,
                pageable);

        List<AdminUserResponse> items = result.getContent().stream()
                .map(AdminUserResponse::new)
                .collect(Collectors.toList());

        return new PageResponse<>(items, page, pageSize, result.getTotalElements(), result.getTotalPages());
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

        return new AdminUserResponse(userRepository.save(user));
    }

    public AdminUserResponse reinstateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        user.setIsSuspended(false);
        user.setSuspendedAt(null);
        user.setSuspendedReason(null);
        // Deliberately NOT flipping isAvailable back on — the operator
        // should have to re-enable visibility explicitly via the mobile
        // app's own toggle, since "reinstated" and "actively listed" are
        // different decisions.

        return new AdminUserResponse(userRepository.save(user));
    }
}