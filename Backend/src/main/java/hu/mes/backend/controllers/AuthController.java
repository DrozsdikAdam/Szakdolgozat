package hu.mes.backend.controllers;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import hu.mes.backend.dtos.auth.ForgotPasswordRequest;
import hu.mes.backend.dtos.auth.LoginRequest;
import hu.mes.backend.dtos.auth.ResetPasswordRequest;
import hu.mes.backend.dtos.user.UserResponse;
import hu.mes.backend.models.User;
import hu.mes.backend.models.enums.AuditAction;
import hu.mes.backend.models.enums.AuditEntityType;
import hu.mes.backend.security.CustomUserDetails;
import hu.mes.backend.services.AuditLogService;
import hu.mes.backend.services.AuthService;
import hu.mes.backend.services.PasswordResetService;
import hu.mes.backend.services.UserService;
import lombok.RequiredArgsConstructor;

import jakarta.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AuditLogService auditLogService;
    private final PasswordResetService passwordResetService;
    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMe(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        UserResponse user = userService.getUserById(userDetails.getId());

        return ResponseEntity.ok(user);
    }

    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        CustomUserDetails userDetails = authService.authenticateUser(
                loginRequest.getUsername(),
                loginRequest.getPassword());

        ResponseCookie accessCookie = authService.generateAccessCookie(userDetails);
        ResponseCookie refreshCookie = authService.generateRefreshCookie(userDetails);

        auditLogService.log(
                userDetails.getUsername(),
                userDetails.getId(),
                AuditAction.LOGIN,
                AuditEntityType.USER,
                userDetails.getUsername(),
                "Sikeres bejelentkezés");

        UserResponse responseBody = userService.getUserById(userDetails.getId());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(responseBody);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails != null) {
            auditLogService.log(
                    userDetails.getUsername(),
                    userDetails.getId(),
                    AuditAction.LOGOUT,
                    AuditEntityType.USER,
                    userDetails.getUsername(),
                    "Sikeres kijelentkezés");
        }

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

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.requestPasswordReset(request);

        auditLogService.log(null,
                null,
                AuditAction.CREATE,
                AuditEntityType.AUTHENTICATION,
                request.getEmail(),
                "Jelszó-visszaállítási kérelem");

        return ResponseEntity.ok(Map.of("message",
                "Amennyiben a megadott e-mail cím regisztrálva van a rendszerben, elküldtük a jelszó-visszaállító linket."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        User user = passwordResetService.resetPassword(request);

        auditLogService.log(
                user.getName(),
                user.getId(),
                AuditAction.UPDATE,
                AuditEntityType.USER,
                user.getId().toString(),
                "Sikeres jelszó-visszaállítás e-mailes hivatkozáson keresztül");

        return ResponseEntity.ok(Map.of("message", "A jelszava sikeresen módosítva lett."));
    }
}
