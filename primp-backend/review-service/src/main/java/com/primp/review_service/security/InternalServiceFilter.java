package com.primp.review_service.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Rejects any request that did not pass through the API Gateway. §8.1
 * describes the gateway as the "single entry point" that verifies JWTs
 * centrally so downstream services don't duplicate that logic — but without
 * this check, any client could hit this service's port directly and forge
 * the X-User-Id header this service otherwise trusts blindly (e.g. to read
 * another user's reviews or submit a review as someone else), since it
 * performs no JWT verification of its own.
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
            response.getWriter().write("Direct access is not permitted; requests must go through the API Gateway");
            return;
        }
        filterChain.doFilter(request, response);
    }
}