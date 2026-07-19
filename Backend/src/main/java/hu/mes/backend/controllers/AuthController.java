package hu.mes.backend.controllers;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import hu.mes.backend.dtos.auth.LoginRequest;
import hu.mes.backend.dtos.auth.LoginResponse;
import hu.mes.backend.security.CustomUserDetails;
import hu.mes.backend.services.AuthService;
import lombok.RequiredArgsConstructor;

import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        CustomUserDetails userDetails = authService.authenticateUser(
                loginRequest.getUsername(),
                loginRequest.getPassword());

        ResponseCookie accessCookie = authService.generateAccessCookie(userDetails);
        ResponseCookie refreshCookie = authService.generateRefreshCookie(userDetails);

        List<String> roles = userDetails.getAuthorities().stream()
                .map(authority -> authority.getAuthority().replace("ROLE_", ""))
                .collect(Collectors.toList());

        LoginResponse responseBody = new LoginResponse(userDetails.getUsername(), roles);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(responseBody);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        ResponseCookie cleanAccess = authService.cleanAccessCookie();
        ResponseCookie cleanRefresh = authService.cleanRefreshCookie();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cleanAccess.toString())
                .header(HttpHeaders.SET_COOKIE, cleanRefresh.toString())
                .body("Sikeres kijelentkezés");
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@CookieValue(name = "refresh_token") String refreshToken) {
        try {
            CustomUserDetails userDetails = authService.loadUserFromRefreshToken(refreshToken);
            ResponseCookie newAccessCookie = authService.generateAccessCookie(userDetails);

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, newAccessCookie.toString())
                    .body("Token sikeresen frissítve");
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Hiba a token frissítésekor: " + e.getMessage());
        }
    }
}
