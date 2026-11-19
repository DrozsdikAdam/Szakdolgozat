package hu.mes.backend.dtos.sync;

import java.time.LocalDateTime;
import java.util.UUID;

import hu.mes.backend.models.enums.QuarantineStatus;
import hu.mes.backend.models.enums.ResolutionStrategy;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class QuarantineItemResponse {

    private UUID id;

    private String operationId;

    private String entityName;

    private String entityId;

    private String httpMethod;

    private String endpointUrl;

    private String payloadJson;

    private String serverStateJson;

    private String errorMessage;

    private QuarantineStatus status;

    private Integer retryCount;

    private ResolutionStrategy resolutionStrategy;

    private String resolvedBy;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime resolvedAt;
}
