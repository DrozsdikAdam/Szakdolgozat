package hu.mes.backend.services;

import java.util.List;
import java.util.UUID;

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
        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .userId(userId)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .details(details)
                .build();
        auditLogRepository.save(auditLog);
    }

}
