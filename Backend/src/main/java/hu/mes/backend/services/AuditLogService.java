package hu.mes.backend.services;

import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import hu.mes.backend.dtos.audit.AuditLogResponse;
import hu.mes.backend.dtos.common.PagedResponse;
import hu.mes.backend.mappers.AuditLogMapper;
import hu.mes.backend.models.AuditLog;
import hu.mes.backend.models.enums.AuditAction;
import hu.mes.backend.models.enums.AuditEntityType;
import hu.mes.backend.repositories.AuditLogRepository;
import hu.mes.backend.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final AuditLogMapper auditLogMapper;

    public PagedResponse<AuditLogResponse> getLogs(AuditEntityType entityType, AuditAction action, Pageable pageable) {
        Page<AuditLog> pageResult;

        if (entityType != null && action != null) {
            pageResult = auditLogRepository.findByEntityTypeAndActionOrderByTimestampDesc(entityType, action, pageable);
        } else if (entityType != null) {
            pageResult = auditLogRepository.findAllByEntityTypeOrderByTimestampDesc(entityType, pageable);
        } else if (action != null) {
            pageResult = auditLogRepository.findAllByActionOrderByTimestampDesc(action, pageable);
        } else {
            pageResult = auditLogRepository.findAllByOrderByTimestampDesc(pageable);
        }

        return PagedResponse.of(pageResult, auditLogMapper.convertToResponses(pageResult.getContent()));
    }

    public void log(AuditAction action, AuditEntityType entityType, String entityId, String details) {
        log(null, null, action, entityType, entityId, details);
    }

    public void log(String username, UUID userId, AuditAction action, AuditEntityType entityType, String entityId,
            String details) {
        String actualUsername = username;
        UUID actualUserId = userId;

        if (actualUsername == null) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
                actualUsername = auth.getName();
                if (auth.getPrincipal() instanceof CustomUserDetails customUserDetails) {
                    actualUserId = customUserDetails.getId();
                }
            } else {
                actualUsername = "SYSTEM";
            }
        }

        AuditLog auditLog = AuditLog.builder()
                .username(actualUsername)
                .userId(actualUserId)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .details(details)
                .build();
        auditLogRepository.save(auditLog);
    }

}
