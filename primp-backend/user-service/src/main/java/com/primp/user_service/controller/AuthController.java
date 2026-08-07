package com.primp.user_service.controller;

import com.primp.user_service.dto.AuthResponse;
import com.primp.user_service.dto.LoginRequest;
import com.primp.user_service.dto.RegisterRequest;
import com.primp.user_service.dto.UserResponse;
import com.primp.user_service.dto.UpdateProfileRequest;
import com.primp.user_service.dto.PremiumPaymentInitializeRequest;
import com.primp.user_service.dto.PremiumPaymentInitializeResponse;
import com.primp.user_service.dto.PremiumPaymentVerifyRequest;
import com.primp.user_service.service.PremiumPaymentService;
import com.primp.user_service.service.UserService;
import com.primp.user_service.dto.PortfolioPostRequest;
import com.primp.user_service.dto.PortfolioPostResponse;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final PremiumPaymentService premiumPaymentService;

    public AuthController(UserService userService, PremiumPaymentService premiumPaymentService) {
        this.userService = userService;
        this.premiumPaymentService = premiumPaymentService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(userService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(userService.login(request));
    }

    @GetMapping("/professionals")
    public ResponseEntity<List<UserResponse>> getProfessionals() {
        return ResponseEntity.ok(userService.getProfessionals());
    }

    @PutMapping("/profile/{userId}")
    public ResponseEntity<UserResponse> updateProfile(
            @RequestHeader("X-User-Id") Long authenticatedUserId,
            @PathVariable Long userId,
            @RequestBody UpdateProfileRequest request) {
        if (!authenticatedUserId.equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized");
        }
        return ResponseEntity.ok(userService.updateProfile(userId, request));
    }

    @PostMapping("/premium/initialize")
    public ResponseEntity<PremiumPaymentInitializeResponse> initializePremiumPayment(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody PremiumPaymentInitializeRequest request) {
        return ResponseEntity.ok(premiumPaymentService.initialize(userId, request));
    }

    @PostMapping("/premium/verify")
    public ResponseEntity<UserResponse> verifyPremiumPayment(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody PremiumPaymentVerifyRequest request) {
        return ResponseEntity.ok(premiumPaymentService.verify(userId, request));
    }

    @PostMapping("/portfolio")
    public ResponseEntity<PortfolioPostResponse> createPortfolioPost(
            @RequestHeader("X-User-Id") Long professionalId,
            @RequestBody PortfolioPostRequest request) {
        return ResponseEntity.ok(userService.createPortfolioPost(professionalId, request));
    }

    @GetMapping("/portfolio/feed")
    public ResponseEntity<List<PortfolioPostResponse>> getPortfolioFeed() {
        return ResponseEntity.ok(userService.getPortfolioFeed());
    }

    @GetMapping("/portfolio/{professionalId}")
    public ResponseEntity<List<PortfolioPostResponse>> getProfessionalPortfolio(
            @PathVariable Long professionalId) {
        return ResponseEntity.ok(userService.getProfessionalPortfolio(professionalId));
    }

    @DeleteMapping("/portfolio/{postId}")
    public ResponseEntity<Void> deletePortfolioPost(
            @RequestHeader("X-User-Id") Long professionalId,
            @PathVariable Long postId) {
        userService.deletePortfolioPost(postId, professionalId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/profile/{userId}")
    public ResponseEntity<UserResponse> getProfile(@PathVariable Long userId) {
        return ResponseEntity.ok(userService.getProfile(userId));
    }
}