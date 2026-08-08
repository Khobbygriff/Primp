package com.primp.gateway.controller;

import com.primp.gateway.security.JwtUtil;
import jakarta.annotation.Nonnull;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Enumeration;

@RestController
public class GatewayController {

    private final RestTemplate restTemplate;
    private final JwtUtil jwtUtil;

    @Value("${user.service.url}")
    private String userServiceUrl;

    @Value("${booking.service.url}")
    private String bookingServiceUrl;

    @Value("${review.service.url}")
    private String reviewServiceUrl;

    @Value("${notification.service.url}")
    private String notificationServiceUrl;

    @Value("${internal.service.secret}")
    private String internalServiceSecret;

    public GatewayController(JwtUtil jwtUtil) {
        this.restTemplate = new RestTemplate();
        this.jwtUtil = jwtUtil;
    }

    @jakarta.annotation.PostConstruct
    public void init() {
        restTemplate.setRequestFactory(
                new org.springframework.http.client.SimpleClientHttpRequestFactory() {
                    @Override
                    protected void prepareConnection(@Nonnull java.net.HttpURLConnection connection,
                                                     @Nonnull String httpMethod) throws java.io.IOException {
                        if ("PATCH".equals(httpMethod)) {
                            connection.setRequestMethod("POST");
                            connection.setRequestProperty("X-HTTP-Method-Override", "PATCH");
                        }
                        super.prepareConnection(connection, httpMethod);
                    }
                }
        );
    }

    @RequestMapping("/api/auth/**")
    public ResponseEntity<String> forwardAuth(HttpServletRequest request, @RequestBody(required = false) String body) {
        String path = request.getRequestURI();
        String method = request.getMethod();

        // Public endpoints don't need user ID
        if (path.startsWith("/api/auth/webhooks/")) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Not found");
        }
        // All other auth endpoints need user ID
        Long userId = extractUserId(request);
        return forward(request, body, userServiceUrl, userId);
    }

    @RequestMapping("/api/users/**")
    public ResponseEntity<String> forwardUsers(
            HttpServletRequest request,
            @RequestBody(required = false) String body) {
        Long userId = extractUserId(request);
        return forward(request, body, userServiceUrl, userId);
    }

    @RequestMapping(value = "/api/bookings/*/receipt", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> forwardBookingsBinary(
            HttpServletRequest request,
            @RequestBody(required = false) String body) {
        Long userId = extractUserId(request);
        return forwardBinary(request, bookingServiceUrl, userId);
    }

    @RequestMapping("/api/bookings/**")
    public ResponseEntity<String> forwardBookings(HttpServletRequest request, @RequestBody(required = false) String body) {
        if (request.getRequestURI().startsWith("/api/bookings/webhooks/")) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Not found");
        }
        Long userId = extractUserId(request);
        return forward(request, body, bookingServiceUrl, userId);
    }

    @RequestMapping("/api/reviews/**")
    public ResponseEntity<String> forwardReviews(
            HttpServletRequest request,
            @RequestBody(required = false) String body) {
        Long userId = extractUserId(request);
        return forward(request, body, reviewServiceUrl, userId);
    }

    @RequestMapping("/api/notifications/**")
    public ResponseEntity<String> forwardNotifications(
            HttpServletRequest request,
            @RequestBody(required = false) String body) {
        if (request.getRequestURI().startsWith("/api/notifications/internal")) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Not found");
        }
        Long userId = extractUserId(request);
        return forward(request, body, notificationServiceUrl, userId);
    }

    @RequestMapping("/api/admin/users/**")
    public ResponseEntity<String> forwardAdminUsers(
            HttpServletRequest request,
            @RequestBody(required = false) String body) {
        ResponseEntity<String> denied = requireAdmin(request);
        if (denied != null) return denied;
        return forward(request, body, userServiceUrl, extractUserId(request));
    }

    @RequestMapping("/api/admin/premium-purchases/**")
    public ResponseEntity<String> forwardAdminPremiumPurchases(
            HttpServletRequest request,
            @RequestBody(required = false) String body) {
        ResponseEntity<String> denied = requireAdmin(request);
        if (denied != null) return denied;
        return forward(request, body, userServiceUrl, extractUserId(request));
    }

    @RequestMapping("/api/admin/bookings/**")
    public ResponseEntity<String> forwardAdminBookings(
            HttpServletRequest request,
            @RequestBody(required = false) String body) {
        ResponseEntity<String> denied = requireAdmin(request);
        if (denied != null) return denied;
        return forward(request, body, bookingServiceUrl, extractUserId(request));
    }

    /**
     * Gate every /api/admin/** route at the edge, before it's even forwarded.
     * Downstream services re-check this too (defense in depth — see
     * AdminUserController etc.) since InternalServiceFilter alone only proves
     * a request came through *a* gateway call, not that the caller is an admin.
     */
    private ResponseEntity<String> requireAdmin(HttpServletRequest request) {
        String role = extractRole(request);
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin access required");
        }
        return null;
    }

    private String extractRole(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                return jwtUtil.extractRole(authHeader.substring(7));
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }

    private ResponseEntity<String> forward(HttpServletRequest request,
                                           String body,
                                           String serviceUrl,
                                           Long userId) {
        String path = request.getRequestURI();
        String queryString = request.getQueryString();
        String url = serviceUrl + path + (queryString != null ? "?" + queryString : "");

        HttpHeaders headers = buildForwardHeaders(request, userId);
        HttpEntity<String> entity = new HttpEntity<>(body, headers);
        HttpMethod method = HttpMethod.valueOf(request.getMethod());

        try {
            return restTemplate.exchange(url, method, entity, String.class);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body("Service unavailable: " + e.getMessage());
        }
    }

    /**
     * Used for endpoints that return binary payloads (e.g. the generated
     * receipt PDF) rather than JSON/text, since forwarding a PDF through the
     * String-typed forward() above would corrupt it.
     */
    private ResponseEntity<byte[]> forwardBinary(HttpServletRequest request,
                                                  String serviceUrl,
                                                  Long userId) {
        String path = request.getRequestURI();
        String queryString = request.getQueryString();
        String url = serviceUrl + path + (queryString != null ? "?" + queryString : "");

        HttpHeaders headers = buildForwardHeaders(request, userId);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        HttpMethod method = HttpMethod.valueOf(request.getMethod());

        try {
            ResponseEntity<byte[]> response = restTemplate.exchange(url, method, entity, byte[].class);
            HttpHeaders responseHeaders = new HttpHeaders();
            if (response.getHeaders().getContentType() != null) {
                responseHeaders.setContentType(response.getHeaders().getContentType());
            }
            if (response.getHeaders().getContentDisposition() != null) {
                responseHeaders.setContentDisposition(response.getHeaders().getContentDisposition());
            }
            return new ResponseEntity<>(response.getBody(), responseHeaders, response.getStatusCode());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
        }
    }

    private HttpHeaders buildForwardHeaders(HttpServletRequest request, Long userId) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Forward original headers
        Enumeration<String> headerNames = request.getHeaderNames();
        while (headerNames.hasMoreElements()) {
            String name = headerNames.nextElement();
            if (!name.equalsIgnoreCase("host")) {
                headers.set(name, request.getHeader(name));
            }
        }

        // Prove to the downstream service that this request actually came through the gateway
        // set unconditionally (even for public auth endpoints with no userId) so every
        // downstream service can enforce "gateway-only" access on all of its traffic,
        // not just authenticated routes.
        headers.set("X-Internal-Secret", internalServiceSecret);

        // Inject user ID as header for downstream services
        if (userId != null) {
            headers.set("X-User-Id", String.valueOf(userId));
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                String role = jwtUtil.extractRole(token);
                if (role != null) {
                    headers.set("X-User-Role", role);
                }
            }
        }
        return headers;
    }

    private Long extractUserId(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                // Extract userId from token claims
                Object userIdClaim = jwtUtil.extractAllClaims(token).get("userId");
                if (userIdClaim != null) {
                    return Long.valueOf(userIdClaim.toString());
                }
                // Fallback — userId not in token yet, return null
                return null;
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }
}