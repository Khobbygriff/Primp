package com.primp.notification_service.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Rejects any request that does not carry the shared internal secret.
 * Two distinct caller types must pass this check: (1) the API Gateway,
 * forwarding client-facing requests ( "single entry point" design),
 * and (2) booking-service's NotificationClient, calling
 * POST /api/notifications/internal directly service-to-service to create a
 * notification — that path never goes through the gateway (the gateway
 * explicitly 404s /api/notifications/internal to keep it non-public), so
 * NotificationClient must also send this header on its own request.
 */
@Component
public class InternalServiceFilter extends OncePerRequestFilter {

    @Value("${internal.service.secret}")
    private String internalServiceSecret;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String provided = request.getHeader("X-Internal-Secret");
        if (provided == null || !provided.equals(internalServiceSecret)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.getWriter().write("Direct access is not permitted; requests must carry a valid internal secret");
            return;
        }
        filterChain.doFilter(request, response);
    }
}