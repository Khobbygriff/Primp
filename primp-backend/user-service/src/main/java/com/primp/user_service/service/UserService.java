package com.primp.user_service.service;

import com.primp.user_service.dto.*;
import com.primp.user_service.model.PortfolioPost;
import com.primp.user_service.repository.PortfolioPostRepository;
import java.util.Comparator;
import java.util.List;
import com.primp.user_service.model.User;
import com.primp.user_service.repository.UserRepository;
import com.primp.user_service.security.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserService {

    private static final int STANDARD_PORTFOLIO_LIMIT = 8;
    private static final int EXTENDED_PORTFOLIO_LIMIT = 50;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final PortfolioPostRepository portfolioPostRepository;
    private final CloudinaryService cloudinaryService;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       PortfolioPostRepository portfolioPostRepository,
                       CloudinaryService cloudinaryService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.portfolioPostRepository = portfolioPostRepository;
        this.cloudinaryService = cloudinaryService;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(User.Role.valueOf(request.getRole().toUpperCase()));
        user.setPhone(request.getPhone());
        user.setLocation(request.getLocation());

        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());
        return new AuthResponse(user.getId(), token, user.getRole().name(), user.getName(), user.getProfilePhotoUrl());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());
        return new AuthResponse(user.getId(), token, user.getRole().name(), user.getName(), user.getProfilePhotoUrl());
    }

    public List<UserResponse> getProfessionals() {
        return userRepository.findByRole(User.Role.PROFESSIONAL)
                .stream()
                .map(this::syncExpiry)
                .filter(user -> Boolean.TRUE.equals(user.getIsAvailable()))
                .sorted(Comparator.comparing(
                                (User u) -> Boolean.TRUE.equals(u.getIsPriorityListingActive()))
                        .reversed())
                .map(this::toUserResponse)
                .collect(java.util.stream.Collectors.toList());
    }

    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getSpecialty() != null) user.setSpecialty(request.getSpecialty());
        if (request.getBio() != null) user.setBio(request.getBio());
        if (request.getLocation() != null) user.setLocation(request.getLocation());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getProfilePhotoUrl() != null) user.setProfilePhotoUrl(request.getProfilePhotoUrl());
        if (request.getIsAvailable() != null) user.setIsAvailable(request.getIsAvailable());
        if (request.getWorkLatitude() != null) user.setWorkLatitude(request.getWorkLatitude());
        if (request.getWorkLongitude() != null) user.setWorkLongitude(request.getWorkLongitude());
        if (request.getServiceRadiusKm() != null) user.setServiceRadiusKm(request.getServiceRadiusKm());

        User saved = userRepository.save(user);
        return toUserResponse(saved);
    }

    /**
     * Applies a verified premium purchase. One-time features
     * (Extended Portfolio, Verified Badge) flip permanently. Subscription
     * features (Priority Listing, Client Loyalty Tools, Earnings Analytics)
     * extend from whichever is later — now, or the current expiry if the
     * subscription hasn't lapsed yet — so renewing early doesn't lose paid time.
     */
    public UserResponse applyPremiumPurchase(Long userId, String feature, String duration) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != User.Role.PROFESSIONAL) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only professional accounts can purchase premium features");
        }

        java.time.LocalDateTime now = java.time.LocalDateTime.now();

        switch (feature) {
            case "PRIORITY_LISTING": {
                long days = "WEEKLY".equals(duration) ? 7 : 30;
                java.time.LocalDateTime base = extendFrom(user.getPriorityListingExpiresAt(), now);
                user.setPriorityListingExpiresAt(base.plusDays(days));
                user.setIsPriorityListingActive(true);
                break;
            }
            case "CLIENT_LOYALTY_TOOLS": {
                java.time.LocalDateTime base = extendFrom(user.getClientLoyaltyToolsExpiresAt(), now);
                user.setClientLoyaltyToolsExpiresAt(base.plusDays(30));
                user.setHasClientLoyaltyTools(true);
                break;
            }
            case "EARNINGS_ANALYTICS": {
                java.time.LocalDateTime base = extendFrom(user.getEarningsAnalyticsExpiresAt(), now);
                user.setEarningsAnalyticsExpiresAt(base.plusDays(30));
                user.setHasEarningsAnalytics(true);
                break;
            }
            case "EXTENDED_PORTFOLIO":
                user.setHasExtendedPortfolio(true);
                break;
            case "VERIFIED_BADGE":
                user.setIsVerifiedBadge(true);
                break;
            default:
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown premium feature: " + feature);
        }

        User saved = userRepository.save(user);
        return toUserResponse(saved);
    }

    private java.time.LocalDateTime extendFrom(java.time.LocalDateTime currentExpiry, java.time.LocalDateTime now) {
        return (currentExpiry != null && currentExpiry.isAfter(now)) ? currentExpiry : now;
    }

    /**
     * Lazily lapses a subscription-based flag once its expiry has passed.
     * Called on every read path (getProfile, getProfessionals) so an unrenewed
     * subscription stops granting access without needing a scheduled job.
     */
    private User syncExpiry(User user) {
        boolean changed = false;
        java.time.LocalDateTime now = java.time.LocalDateTime.now();

        if (Boolean.TRUE.equals(user.getIsPriorityListingActive())
                && user.getPriorityListingExpiresAt() != null
                && user.getPriorityListingExpiresAt().isBefore(now)) {
            user.setIsPriorityListingActive(false);
            changed = true;
        }
        if (Boolean.TRUE.equals(user.getHasClientLoyaltyTools())
                && user.getClientLoyaltyToolsExpiresAt() != null
                && user.getClientLoyaltyToolsExpiresAt().isBefore(now)) {
            user.setHasClientLoyaltyTools(false);
            changed = true;
        }
        if (Boolean.TRUE.equals(user.getHasEarningsAnalytics())
                && user.getEarningsAnalyticsExpiresAt() != null
                && user.getEarningsAnalyticsExpiresAt().isBefore(now)) {
            user.setHasEarningsAnalytics(false);
            changed = true;
        }

        return changed ? userRepository.save(user) : user;
    }

    public PortfolioPostResponse createPortfolioPost(Long professionalId, PortfolioPostRequest request) {
        User professional = userRepository.findById(professionalId)
                .orElseThrow(() -> new RuntimeException("Professional not found"));

        int limit = Boolean.TRUE.equals(professional.getHasExtendedPortfolio())
                ? EXTENDED_PORTFOLIO_LIMIT
                : STANDARD_PORTFOLIO_LIMIT;
        long currentCount = portfolioPostRepository.countByProfessionalId(professionalId);
        if (currentCount >= limit) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Portfolio limit reached (" + limit + " photos). Unlock Extended Portfolio for up to "
                            + EXTENDED_PORTFOLIO_LIMIT + ".");
        }

        PortfolioPost post = new PortfolioPost();
        post.setProfessionalId(professionalId);
        post.setMediaType(request.getMediaType());
        post.setImageUrl(request.getImageUrl());
        post.setStyleTag(request.getStyleTag());
        post.setCaption(request.getCaption());

        PortfolioPost saved = portfolioPostRepository.save(post);
        return new PortfolioPostResponse(saved, professional.getName(), professional.getSpecialty(), professional.getProfilePhotoUrl());
    }

    public List<PortfolioPostResponse> getPortfolioFeed() {
        return portfolioPostRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(post -> {
                    User professional = userRepository.findById(post.getProfessionalId())
                            .orElse(null);
                    String name = professional != null ? professional.getName() : "Unknown";
                    String specialty = professional != null ? professional.getSpecialty() : "";
                    return new PortfolioPostResponse(post, name, specialty, professional != null ? professional.getProfilePhotoUrl() : null);
                })
                .collect(java.util.stream.Collectors.toList());
    }

    public List<PortfolioPostResponse> getProfessionalPortfolio(Long professionalId) {
        User professional = userRepository.findById(professionalId)
                .orElseThrow(() -> new RuntimeException("Professional not found"));
        return portfolioPostRepository.findByProfessionalIdOrderByCreatedAtDesc(professionalId)
                .stream()
                .map(post -> new PortfolioPostResponse(post, professional.getName(), professional.getSpecialty(), professional.getProfilePhotoUrl()))
                .collect(java.util.stream.Collectors.toList());
    }

    public void deletePortfolioPost(Long postId, Long professionalId) {
        PortfolioPost post = portfolioPostRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        if (!post.getProfessionalId().equals(professionalId)) {
            throw new RuntimeException("Unauthorized");
        }

        // Delete from Cloudinary first
        if ("video".equals(post.getMediaType())) {
            cloudinaryService.deleteVideo(post.getImageUrl());
        } else {
            cloudinaryService.deleteImage(post.getImageUrl());
        }

        // Then delete from database
        portfolioPostRepository.delete(post);
    }

    public UserResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return toUserResponse(syncExpiry(user));
    }

    private UserResponse toUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getLocation(),
                user.getRole().name(),
                user.getPhone(),
                user.getSpecialty(),
                user.getBio(),
                user.getProfilePhotoUrl(),
                user.getIsAvailable(),
                user.getIsPriorityListingActive(),
                user.getHasExtendedPortfolio(),
                user.getIsVerifiedBadge(),
                user.getHasClientLoyaltyTools(),
                user.getHasEarningsAnalytics(),
                user.getPriorityListingExpiresAt(),
                user.getClientLoyaltyToolsExpiresAt(),
                user.getEarningsAnalyticsExpiresAt(),
                user.getWorkLatitude(),
                user.getWorkLongitude(),
                user.getServiceRadiusKm()
        );
    }
}