/*
================================================================
Ez a fájl mesterséges intelligencia segítségével íródott. 
================================================================
*/
package hu.mes.backend.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import hu.mes.backend.security.CustomUserDetails;
import hu.mes.backend.security.CustomUserDetailsService;
import hu.mes.backend.security.JwtUtils;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @InjectMocks
    private AuthService authService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtUtils jwtUtils;

    @Mock
    private CustomUserDetailsService customUserDetailsService;

    private CustomUserDetails userDetails;
    private hu.mes.backend.models.User user;

    @BeforeEach
    void setUp() {
        user = hu.mes.backend.models.User.builder()
                .name("testuser")
                .password("encodedPassword")
                .email("test@mes.hu")
                .roles(Collections.emptySet())
                .active(true)
                .build();
        user.setId(UUID.randomUUID());
        userDetails = new CustomUserDetails(user);
    }

    @Test
    void authenticateUser_Success() {
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(userDetails);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);

        CustomUserDetails result = authService.authenticateUser("testuser", "password123");

        assertNotNull(result);
        assertEquals("testuser", result.getUsername());
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    void authenticateUser_BadCredentials_ThrowsException() {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Hibás hitelesítési adatok"));

        assertThrows(BadCredentialsException.class, () -> authService.authenticateUser("testuser", "wrongpassword"));
    }

    @Test
    void generateAccessCookie_ReturnsValidCookie() {
        when(jwtUtils.generateJwtToken(userDetails)).thenReturn("mockJwtToken");
        when(jwtUtils.getExpirationMs()).thenReturn(3600000L); // 1 hour

        ResponseCookie cookie = authService.generateAccessCookie(userDetails);

        assertNotNull(cookie);
        assertEquals("access_token", cookie.getName());
        assertEquals("mockJwtToken", cookie.getValue());
        assertTrue(cookie.isHttpOnly());
        assertEquals("/", cookie.getPath());
    }

    @Test
    void generateRefreshCookie_ReturnsValidCookie() {
        when(jwtUtils.refreshToken(userDetails)).thenReturn("mockRefreshToken");
        when(jwtUtils.getExpirationMs()).thenReturn(3600000L);

        ResponseCookie cookie = authService.generateRefreshCookie(userDetails);

        assertNotNull(cookie);
        assertEquals("refresh_token", cookie.getName());
        assertEquals("mockRefreshToken", cookie.getValue());
        assertTrue(cookie.isHttpOnly());
        assertEquals("/api/auth/refresh", cookie.getPath());
    }

    @Test
    void cleanAccessCookie_ReturnsExpiredCookie() {
        ResponseCookie cookie = authService.cleanAccessCookie();

        assertNotNull(cookie);
        assertEquals("access_token", cookie.getName());
        assertEquals("", cookie.getValue());
        assertEquals(0, cookie.getMaxAge().getSeconds());
    }

    @Test
    void cleanRefreshCookie_ReturnsExpiredCookie() {
        ResponseCookie cookie = authService.cleanRefreshCookie();

        assertNotNull(cookie);
        assertEquals("refresh_token", cookie.getName());
        assertEquals("", cookie.getValue());
        assertEquals(0, cookie.getMaxAge().getSeconds());
    }

    @Test
    void loadUserFromRefreshToken_ValidToken_ReturnsUserDetails() {
        String token = "validRefreshToken";
        when(jwtUtils.getUsernameFromToken(token)).thenReturn("testuser");
        when(customUserDetailsService.loadUserByUsername("testuser")).thenReturn(userDetails);
        when(jwtUtils.validateToken(token, userDetails)).thenReturn(true);

        CustomUserDetails result = authService.loadUserFromRefreshToken(token);

        assertNotNull(result);
        assertEquals("testuser", result.getUsername());
    }

    @Test
    void loadUserFromRefreshToken_InvalidToken_ThrowsRuntimeException() {
        String token = "invalidRefreshToken";
        when(jwtUtils.getUsernameFromToken(token)).thenReturn("testuser");
        when(customUserDetailsService.loadUserByUsername("testuser")).thenReturn(userDetails);
        when(jwtUtils.validateToken(token, userDetails)).thenReturn(false);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> authService.loadUserFromRefreshToken(token));
        assertEquals("Érvénytelen vagy lejárt refresh token.", ex.getMessage());
    }
}
