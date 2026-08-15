package hu.mes.backend.services;

import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import hu.mes.backend.security.CustomUserDetails;
import hu.mes.backend.security.CustomUserDetailsService;
import hu.mes.backend.security.JwtUtils;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final CustomUserDetailsService customUserDetailsService;

    public CustomUserDetails authenticateUser(String username, String password) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password));
        return (CustomUserDetails) authentication.getPrincipal();
    }

    public ResponseCookie generateAccessCookie(CustomUserDetails userDetails) {
        String jwt = jwtUtils.generateJwtToken(userDetails);
        return ResponseCookie.from("access_token", jwt)
                .path("/")
                .httpOnly(true)
                .secure(false) // Lokális HTTP fejlesztés miatt false, éles HTTPS környezetben true
                .sameSite("Lax")
                .maxAge(jwtUtils.getExpirationMs() / 1000)
                .build();
    }

    public ResponseCookie generateRefreshCookie(CustomUserDetails userDetails) {
        String refreshToken = jwtUtils.refreshToken(userDetails);
        return ResponseCookie.from("refresh_token", refreshToken)
                .path("/api/auth/refresh")
                .httpOnly(true)
                .secure(false) // Lokális HTTP fejlesztés miatt false, éles HTTPS környezetben true
                .sameSite("Lax")
                .maxAge((jwtUtils.getExpirationMs() * 7) / 1000)
                .build();
    }

    public ResponseCookie cleanAccessCookie() {
        return ResponseCookie.from("access_token", "")
                .path("/")
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .maxAge(0)
                .build();
    }

    public ResponseCookie cleanRefreshCookie() {
        return ResponseCookie.from("refresh_token", "")
                .path("/api/auth/refresh")
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .maxAge(0)
                .build();
    }

    public CustomUserDetails loadUserFromRefreshToken(String refreshToken) {
        String username = jwtUtils.getUsernameFromToken(refreshToken);
        CustomUserDetails userDetails = customUserDetailsService.loadUserByUsername(username);

        if (!jwtUtils.validateToken(refreshToken, userDetails)) {
            throw new RuntimeException("Érvénytelen vagy lejárt refresh token.");
        }

        return userDetails;
    }
}
