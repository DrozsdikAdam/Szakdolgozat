package hu.mes.backend.services;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import hu.mes.backend.dtos.auth.ForgotPasswordRequest;
import hu.mes.backend.dtos.auth.ResetPasswordRequest;
import hu.mes.backend.models.User;
import hu.mes.backend.repositories.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PasswordResetService {

    private final EmailService emailService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final StringRedisTemplate stringRedisTemplate;
    @Value("${app.frontend.reset-password-url}")
    private String resetPasswordUrl;
    @Value("${app.auth.reset-token-expiration-minutes:15}")
    private int expirationMinutes;
    private static final String RESET_TOKEN_PREFIX = "password_reset:";

    public void requestPasswordReset(ForgotPasswordRequest request) {

        Optional<User> userOpt = userRepository.findByEmailAndActiveTrue(request.getEmail());

        if (!userOpt.isPresent()) {
            log.info("Jelszó-visszaállítás kérve nem létező emailre: {}", request.getEmail());
            return;
        }
        User user = userOpt.get();

        String token = UUID.randomUUID().toString();
        String redisKey = RESET_TOKEN_PREFIX + token;
        stringRedisTemplate.opsForValue().set(
                redisKey,
                user.getEmail(),
                Duration.ofMinutes(expirationMinutes));

        String resetLink = resetPasswordUrl + "?token=" + token;

        emailService.sendPasswordResetEmail(user.getEmail(), resetLink);

    }

    public User resetPassword(ResetPasswordRequest request) {
        String email = stringRedisTemplate.opsForValue().get(RESET_TOKEN_PREFIX + request.getToken());

        if (email == null)
            throw new IllegalArgumentException("A jelszó-visszaállító link érvénytelen vagy lejárt.");

        User user = userRepository.findByEmailAndActiveTrue(email)
                .orElseThrow(() -> new IllegalArgumentException("A felhasználó nem található."));

        String encryptedPassword = passwordEncoder.encode(request.getNewPassword());

        user.setPassword(encryptedPassword);
        userRepository.save(user);

        stringRedisTemplate.delete(RESET_TOKEN_PREFIX + request.getToken());

        return user;
    }

}
