/*
================================================================
Ez a fájl mesterséges intelligencia segítségével íródott. 
================================================================
*/
package hu.mes.backend.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Collections;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.cache.CacheManager;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;

import hu.mes.backend.dtos.auth.ForgotPasswordRequest;
import hu.mes.backend.dtos.auth.LoginRequest;
import hu.mes.backend.dtos.auth.ResetPasswordRequest;
import hu.mes.backend.dtos.user.UserResponse;
import hu.mes.backend.models.User;
import hu.mes.backend.security.CustomUserDetails;
import hu.mes.backend.security.CustomUserDetailsService;
import hu.mes.backend.security.JwtAuthenticationFilter;
import hu.mes.backend.security.JwtUtils;
import hu.mes.backend.services.AuditLogService;
import hu.mes.backend.services.AuthService;
import hu.mes.backend.services.PasswordResetService;
import hu.mes.backend.services.UserService;
import jakarta.servlet.http.Cookie;

@WebMvcTest(controllers = AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
public class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @MockitoBean
    private CacheManager cacheManager;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private AuditLogService auditLogService;

    @MockitoBean
    private PasswordResetService passwordResetService;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockitoBean
    private JwtUtils jwtUtils;

    @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

    private User user;
    private CustomUserDetails userDetails;
    private UserResponse userResponse;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        user = User.builder()
                .name("testuser")
                .email("test@mes.hu")
                .password("encodedPassword")
                .roles(Collections.emptySet())
                .active(true)
                .build();
        user.setId(userId);
        userDetails = new CustomUserDetails(user);

        userResponse = new UserResponse();
        userResponse.setId(userId);
        userResponse.setUsername("testuser");
        userResponse.setEmail("test@mes.hu");
    }

    @Test
    void login_Success_ReturnsUserAndSetsCookies() throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("Password123!");

        ResponseCookie accessCookie = ResponseCookie.from("access_token", "jwt-access-token").path("/").build();
        ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", "jwt-refresh-token")
                .path("/api/auth/refresh").build();

        when(authService.authenticateUser("testuser", "Password123!")).thenReturn(userDetails);
        when(authService.generateAccessCookie(userDetails)).thenReturn(accessCookie);
        when(authService.generateRefreshCookie(userDetails)).thenReturn(refreshCookie);
        when(userService.getUserById(userId)).thenReturn(userResponse);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(header().exists(HttpHeaders.SET_COOKIE))
                .andExpect(jsonPath("$.username").value("testuser"))
                .andExpect(jsonPath("$.email").value("test@mes.hu"));
    }

    @Test
    void login_InvalidRequest_EmptyFields_ReturnsBadRequest() throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("");
        loginRequest.setPassword("");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void logout_Success_ClearsCookies() throws Exception {
        ResponseCookie cleanAccess = ResponseCookie.from("access_token", "").maxAge(0).build();
        ResponseCookie cleanRefresh = ResponseCookie.from("refresh_token", "").maxAge(0).build();

        when(authService.cleanAccessCookie()).thenReturn(cleanAccess);
        when(authService.cleanRefreshCookie()).thenReturn(cleanRefresh);

        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(header().exists(HttpHeaders.SET_COOKIE));
    }

    @Test
    void refresh_ValidCookie_ReturnsOkAndNewCookie() throws Exception {
        ResponseCookie newAccess = ResponseCookie.from("access_token", "new-jwt-access").build();
        when(authService.loadUserFromRefreshToken("valid-refresh-token")).thenReturn(userDetails);
        when(authService.generateAccessCookie(userDetails)).thenReturn(newAccess);

        mockMvc.perform(post("/api/auth/refresh")
                .cookie(new Cookie("refresh_token", "valid-refresh-token")))
                .andExpect(status().isOk())
                .andExpect(header().exists(HttpHeaders.SET_COOKIE));
    }

    @Test
    void forgotPassword_ValidEmail_ReturnsOk() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("test@mes.hu");

        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists());

        verify(passwordResetService).requestPasswordReset(any(ForgotPasswordRequest.class));
    }

    @Test
    void resetPassword_ValidRequest_ReturnsOk() throws Exception {
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("reset-token-uuid");
        request.setNewPassword("NewSecretPassword123!");

        when(passwordResetService.resetPassword(any(ResetPasswordRequest.class))).thenReturn(user);

        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("A jelszava sikeresen módosítva lett."));
    }
}
