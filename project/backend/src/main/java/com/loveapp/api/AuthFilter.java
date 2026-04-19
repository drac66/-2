package com.loveapp.api;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class AuthFilter extends OncePerRequestFilter {
    private final AuthController authController;

    public AuthFilter(AuthController authController) {
        this.authController = authController;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        if (!path.startsWith("/api/") || path.startsWith("/api/auth")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = request.getHeader("X-Auth-Token");
        if (!authController.isTokenAllowed(token)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"success\":false,\"message\":\"unauthorized\",\"data\":null}");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
