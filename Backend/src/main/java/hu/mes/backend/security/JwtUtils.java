package hu.mes.backend.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.github.resilience4j.core.lang.NonNull;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtils {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private long expirationMs;

    public long getExpirationMs() {
        return expirationMs;
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
    }

    public String generateJwtToken(@NonNull CustomUserDetails customUserDetails) {
        return Jwts.builder()
                .subject(customUserDetails.getUsername())
                .claim("authorities", customUserDetails.getAuthorities().stream()
                        .map(authority -> authority.getAuthority().replace("ROLE_", ""))
                        .collect(java.util.stream.Collectors.toList()))
                .issuedAt(new Date())
                .expiration(new Date(new Date().getTime() + expirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    public String refreshToken(@NonNull CustomUserDetails customUserDetails) {
        return Jwts.builder()
                .subject(customUserDetails.getUsername())
                .issuedAt(new Date())
                .expiration(new Date(new Date().getTime() + (expirationMs * 7)))
                .signWith(getSigningKey())
                .compact();
    }

    public void decodeToken(String token) {
        try {
            Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token);
        } catch (Exception e) {
            throw new RuntimeException("Hiba a token dekódolásakor: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    public List<String> getAuthorities(String token) {
        return Jwts.parser().verifyWith(getSigningKey()).build()
                .parseSignedClaims(token).getPayload().get("authorities", List.class);
    }

    public String getUsernameFromToken(String token) {
        return Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token).getPayload().getSubject();
    }

    public Boolean isTokenExpired(String token) {
        return Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token).getPayload().getExpiration()
                .before(new Date());
    }

    public Boolean validateToken(String token, CustomUserDetails customUserDetails) {
        try {
            return (Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token).getPayload().getSubject()
                    .equals(customUserDetails.getUsername()) && !isTokenExpired(token));
        } catch (Exception e) {
            System.err.println("Hiba a token érvényesítésekor: " + e.getMessage());
            return false;
        }
    }

}
