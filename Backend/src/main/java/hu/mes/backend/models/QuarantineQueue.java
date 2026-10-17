package hu.mes.backend.models;

import java.time.LocalDateTime;
import java.util.UUID;

import hu.mes.backend.models.enums.QuarantineStatus;
import hu.mes.backend.models.enums.ResolutionStrategy;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "quarantine_queue")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(callSuper = true)
public class QuarantineQueue extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "operation_id", nullable = false, unique = true, length = 64)
    private String operationId;

    @Column(name = "entity_name", nullable = false, length = 100)
    private String entityName;

    @Column(name = "entity_id", length = 64)
    private String entityId;

    @Column(name = "http_method", nullable = false, length = 10)
    private String httpMethod;

    @Column(name = "endpoint_url", nullable = false, length = 255)
    private String endpointUrl;

    @Lob
    @Column(name = "payload_json")
    private String payloadJson;

    @Lob
    @Column(name = "server_state_json")
    private String serverStateJson;

    @Column(name = "error_message", length = 2000)
    private String errorMessage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private QuarantineStatus status = QuarantineStatus.CONFLICT;

    @Column(name = "retry_count", nullable = false)
    @Builder.Default
    private Integer retryCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "resolution_strategy", length = 30)
    private ResolutionStrategy resolutionStrategy;

    @Column(name = "resolved_by", length = 100)
    private String resolvedBy;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;
}