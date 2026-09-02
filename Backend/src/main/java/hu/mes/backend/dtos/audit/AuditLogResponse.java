package hu.mes.backend.dtos.audit;

import java.time.LocalDateTime;
import java.util.UUID;

import hu.mes.backend.models.enums.AuditAction;
import hu.mes.backend.models.enums.AuditEntityType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AuditLogResponse {

    private UUID id;
    private String username;
    private UUID userId;
    private AuditAction action;
    private AuditEntityType entityType;
    private String entityId;
    private String details;
    private String ipAddress;
    private LocalDateTime timestamp;

}
