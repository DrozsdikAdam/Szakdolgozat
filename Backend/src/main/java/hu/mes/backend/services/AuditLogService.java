package hu.mes.backend.services;

import java.util.List;
import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import hu.mes.backend.dtos.audit.AuditLogResponse;
import hu.mes.backend.mappers.AuditLogMapper;
import hu.mes.backend.models.AuditLog;
import hu.mes.backend.models.enums.AuditAction;
import hu.mes.backend.models.enums.AuditEntityType;
import hu.mes.backend.repositories.AuditLogRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final AuditLogMapper auditLogMapper;

    public List<AuditLogResponse> getRecentLogs() {
        List<AuditLog> response = auditLogRepository.findTop100ByOrderByTimestampDesc();
        return auditLogMapper.convertToResponses(response);
    }

    public List<AuditLogResponse> getLogsByEntityType(AuditEntityType type) {
        List<AuditLog> response = auditLogRepository.findByEntityTypeOrderByTimestampDesc(type);
        return auditLogMapper.convertToResponses(response);
    }

    public void log(String username, UUID userId, AuditAction action, AuditEntityType entityType, String entityId,
            String details) {
        String actualUsername = username;

        if (actualUsername == null || actualUsername.equals("USER") || actualUsername.equals("OPERATOR")
                || actualUsername.equals("PLANNER") || actualUsername.equals("TECHNICIAN")
                || actualUsername.equals("WAREHOUSE") || actualUsername.equals("MANAGER")) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
                actualUsername = auth.getName();
            } else {
                actualUsername = "SYSTEM";
            }
        }

        AuditLog auditLog = AuditLog.builder()
                .username(actualUsername)
                .userId(userId)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .details(details)
                .build();
        auditLogRepository.save(auditLog);
    }

}
