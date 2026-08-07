package com.primp.user_service.repository;

import com.primp.user_service.model.PortfolioPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PortfolioPostRepository extends JpaRepository<PortfolioPost, Long> {
    List<PortfolioPost> findByProfessionalIdOrderByCreatedAtDesc(Long professionalId);
    List<PortfolioPost> findAllByOrderByCreatedAtDesc();
    List<PortfolioPost> findByStyleTagOrderByCreatedAtDesc(String styleTag);
    long countByProfessionalId(Long professionalId);
}