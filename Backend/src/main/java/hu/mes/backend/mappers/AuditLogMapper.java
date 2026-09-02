package hu.mes.backend.mappers;

import java.util.List;

import org.springframework.stereotype.Component;

import hu.mes.backend.dtos.audit.AuditLogResponse;
import hu.mes.backend.models.AuditLog;

@Component
public class AuditLogMapper {

    public AuditLogResponse convertToResponse(AuditLog auditLog) {
        return AuditLogResponse.builder()
                .id(auditLog.getId())
                .username(auditLog.getUsername())
                .userId(auditLog.getUserId())
                .action(auditLog.getAction())
                .entityType(auditLog.getEntityType())
                .entityId(auditLog.getEntityId())
                .details(auditLog.getDetails())
                .ipAddress(auditLog.getIpAddress())
                .timestamp(auditLog.getTimestamp())
                .build();
    }

    public List<AuditLogResponse> convertToResponses(List<AuditLog> auditLogs) {
        return auditLogs.stream().map(this::convertToResponse).toList();
    }

}
