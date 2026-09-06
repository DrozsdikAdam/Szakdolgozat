/*
================================================================
Ez a fájl mesterséges intelligencia segítségével íródott. 
================================================================
*/
package hu.mes.backend.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import hu.mes.backend.dtos.auth.ForgotPasswordRequest;
import hu.mes.backend.dtos.auth.ResetPasswordRequest;
import hu.mes.backend.models.User;
import hu.mes.backend.repositories.UserRepository;

@ExtendWith(MockitoExtension.class)
public class PasswordResetServiceTest {

    @InjectMocks
    private PasswordResetService passwordResetService;

    @Mock
    private EmailService emailService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private User user;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(passwordResetService, "resetPasswordUrl", "http://localhost:5173/reset-password");
        ReflectionTestUtils.setField(passwordResetService, "expirationMinutes", 15);

        user = User.builder()
                .name("testuser")
                .email("test@mes.hu")
                .password("oldPassword")
                .active(true)
                .build();
        user.setId(UUID.randomUUID());
    }

    @Test
    void requestPasswordReset_UserExists_SetsRedisAndSendsEmail() {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("test@mes.hu");

        when(userRepository.findByEmailAndActiveTrue("test@mes.hu")).thenReturn(Optional.of(user));
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);

        passwordResetService.requestPasswordReset(request);

        verify(valueOperations).set(contains("password_reset:"), eq("test@mes.hu"), eq(Duration.ofMinutes(15)));
        verify(emailService).sendPasswordResetEmail(eq("test@mes.hu"),
                contains("http://localhost:5173/reset-password?token="));
    }

    @Test
    void requestPasswordReset_UserNotFound_DoesNothing() {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("unknown@mes.hu");

        when(userRepository.findByEmailAndActiveTrue("unknown@mes.hu")).thenReturn(Optional.empty());

        passwordResetService.requestPasswordReset(request);

        verify(stringRedisTemplate, never()).opsForValue();
        verify(emailService, never()).sendPasswordResetEmail(any(), any());
    }

    @Test
    void resetPassword_ValidToken_UpdatesPasswordAndDeletesToken() {
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("valid-token-123");
        request.setNewPassword("newSecretPassword");

        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("password_reset:valid-token-123")).thenReturn("test@mes.hu");
        when(userRepository.findByEmailAndActiveTrue("test@mes.hu")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("newSecretPassword")).thenReturn("encodedNewSecret");

        User updatedUser = passwordResetService.resetPassword(request);

        assertNotNull(updatedUser);
        assertEquals("encodedNewSecret", user.getPassword());
        verify(userRepository).save(user);
        verify(stringRedisTemplate).delete("password_reset:valid-token-123");
    }

    @Test
    void resetPassword_InvalidOrExpiredToken_ThrowsIllegalArgumentException() {
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("expired-token");
        request.setNewPassword("newSecretPassword");

        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("password_reset:expired-token")).thenReturn(null);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> passwordResetService.resetPassword(request));
        assertEquals("A jelszó-visszaállító link érvénytelen vagy lejárt.", ex.getMessage());

        verify(userRepository, never()).save(any());
    }

    @Test
    void resetPassword_UserNotFoundForEmail_ThrowsIllegalArgumentException() {
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("valid-token");
        request.setNewPassword("newSecretPassword");

        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("password_reset:valid-token")).thenReturn("deleted@mes.hu");
        when(userRepository.findByEmailAndActiveTrue("deleted@mes.hu")).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> passwordResetService.resetPassword(request));
        assertEquals("A felhasználó nem található.", ex.getMessage());
    }
}
