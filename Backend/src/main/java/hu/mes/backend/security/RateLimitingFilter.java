package hu.mes.backend.security;

import java.io.IOException;
import java.net.InetAddress;
import java.time.Duration;
import java.util.HashMap;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private final ObjectMapper objectMapper = new ObjectMapper();

    private final Cache<String, Bucket> loginBuckets = Caffeine.newBuilder()
            .expireAfterAccess(Duration.ofMinutes(10))
            .maximumSize(10_000)
            .build();
    private final Cache<String, Bucket> apiBuckets = Caffeine.newBuilder()
            .expireAfterAccess(Duration.ofMinutes(10))
            .maximumSize(10_000)
            .build();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String ip;
        Bucket bucket;
        String uri = request.getRequestURI();
        String message = null;
        String error = "Too many requests!";

        if (!uri.startsWith("/api")) {
            filterChain.doFilter(request, response);
            return;
        }

        ip = getIp(request);

        if (uri.startsWith("/api/auth/login")) {
            bucket = loginBuckets.get(ip, k -> createBucket(true));
            message = "Túl sok bejelentkezési kísérlet! Kérjük, várjon egy percet.";
        } else {
            bucket = apiBuckets.get(ip, k -> createBucket(false));
            message = "Túl sok API kérés! Kérjük, várjon egy percet.";
        }

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
            return;
        }

        var errorResponse = new HashMap<String, String>();
        errorResponse.put("error", error);
        errorResponse.put("message", message);

        response.setContentType("application/json;charset=UTF-8");
        response.setStatus(429);
        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
    }

    private Bucket createBucket(Boolean isLogin) {

        Integer capacity = isLogin ? 10 : 100;
        Integer refillTime = 1;

        return Bucket.builder()
                .addLimit(Bandwidth.classic(capacity, Refill.intervally(capacity, Duration.ofMinutes(refillTime))))
                .build();
    }

    private String getIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");

        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip))
            ip = request.getRemoteAddr();

        if (ip.contains(","))
            ip = ip.split(",")[0].trim();

        if (ip.contains("[")) {
            ip = ip.substring(ip.indexOf("[") + 1, ip.indexOf("]")).trim();
        } else if (ip.contains(":") && ip.indexOf(":") == ip.lastIndexOf(":")) {
            ip = ip.split(":")[0].trim();
        }

        if (isValidIp(ip))
            return ip;

        return request.getRemoteAddr();
    }

    private boolean isValidIp(String ip) {
        try {
            if (ip.matches("^(\\d{1,3}\\.){3}\\d{1,3}$")
                    || (ip.matches("^[0-9a-fA-F:]+$") && ip.contains(":")))
                InetAddress.getByName(ip);
            else
                return false;
            return true;
        } catch (Exception e) {
            return false;
        }
    }

}
