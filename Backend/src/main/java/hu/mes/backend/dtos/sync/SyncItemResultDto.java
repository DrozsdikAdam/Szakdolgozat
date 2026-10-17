package hu.mes.backend.dtos.sync;

import java.util.UUID;

import hu.mes.backend.models.enums.SyncItemStatus;
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
public class SyncItemResultDto {

    private String operationId;

    private String entityName;

    private String entityId;

    private SyncItemStatus status;

    private UUID quarantineId;

    private String message;
}
