package com.primp.user_service.repository;

import com.primp.user_service.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRole(User.Role role);

    long countByRole(User.Role role);
    long countByIsSuspendedTrue();
    long countByCreatedAtAfter(java.time.LocalDateTime threshold);

    @Query("SELECT u FROM User u WHERE " +
            "(:search IS NULL OR LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "  OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND (:role IS NULL OR u.role = :role) " +
            "AND (:includeSuspended = TRUE OR u.isSuspended = FALSE OR u.isSuspended IS NULL)")
    org.springframework.data.domain.Page<User> searchUsers(
            @org.springframework.data.repository.query.Param("search") String search,
            @org.springframework.data.repository.query.Param("role") User.Role role,
            @org.springframework.data.repository.query.Param("includeSuspended") boolean includeSuspended,
            org.springframework.data.domain.Pageable pageable);
}