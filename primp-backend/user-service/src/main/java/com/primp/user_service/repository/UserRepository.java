package com.primp.user_service.repository;

import com.primp.user_service.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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
            "(:search = '' OR LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "  OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND (:role IS NULL OR u.role = :role) " +
            "AND (:includeSuspended = TRUE OR u.isSuspended = FALSE OR u.isSuspended IS NULL)")
    Page<User> searchUsers(@Param("search") String search, @Param("role") User.Role role,
                           @Param("includeSuspended") boolean includeSuspended, Pageable pageable);
}