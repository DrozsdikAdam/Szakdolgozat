package hu.mes.backend.mappers;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import hu.mes.backend.dtos.sync.QuarantineItemResponse;
import hu.mes.backend.dtos.sync.SyncBatchResponseDto;
import hu.mes.backend.dtos.sync.SyncItemDto;
import hu.mes.backend.dtos.sync.SyncItemResultDto;
import hu.mes.backend.models.Inventory;
import hu.mes.backend.models.QuarantineQueue;
import hu.mes.backend.models.WorkOrder;
import hu.mes.backend.models.enums.SyncItemStatus;
import hu.mes.backend.models.enums.WorkOrderPriority;
import hu.mes.backend.models.enums.WorkOrderStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class QuarantineMapper {

    private final ObjectMapper objectMapper;

    public QuarantineItemResponse convertToResponse(QuarantineQueue quarantine) {
        if (quarantine == null) {
            return null;
        }

        return QuarantineItemResponse.builder()
                .id(quarantine.getId())
                .operationId(quarantine.getOperationId())
                .entityName(quarantine.getEntityName())
                .entityId(quarantine.getEntityId())
                .httpMethod(quarantine.getHttpMethod())
                .endpointUrl(quarantine.getEndpointUrl())
                .payloadJson(quarantine.getPayloadJson())
                .serverStateJson(quarantine.getServerStateJson())
                .errorMessage(quarantine.getErrorMessage())
                .status(quarantine.getStatus())
                .retryCount(quarantine.getRetryCount())
                .resolutionStrategy(quarantine.getResolutionStrategy())
                .resolvedBy(quarantine.getResolvedBy())
                .createdAt(quarantine.getCreatedAt())
                .updatedAt(quarantine.getUpdatedAt())
                .resolvedAt(quarantine.getResolvedAt())
                .build();
    }

    public List<QuarantineItemResponse> convertToResponses(List<QuarantineQueue> quarantines) {
        if (quarantines == null) {
            return new ArrayList<>();
        }

        return quarantines.stream().map(this::convertToResponse).toList();
    }

    public SyncItemResultDto toResultDto(SyncItemDto item, SyncItemStatus status, UUID quarantineId, String message) {
        if (item == null) {
            return null;
        }

        return SyncItemResultDto.builder()
                .operationId(item.getOperationId())
                .entityName(item.getEntityName())
                .entityId(item.getEntityId())
                .status(status)
                .quarantineId(quarantineId)
                .message(message)
                .build();
    }

    public SyncItemResultDto toAppliedResult(SyncItemDto item) {
        return toResultDto(item, SyncItemStatus.APPLIED, null, "Sikeresen szinkronizálva és alkalmazva.");
    }

    public SyncItemResultDto toSkippedResult(SyncItemDto item) {
        return toResultDto(item, SyncItemStatus.SKIPPED, null, "A művelet korábban már feldolgozásra került.");
    }

    public SyncItemResultDto toConflictResult(SyncItemDto item, UUID quarantineId, String message) {
        return toResultDto(item, SyncItemStatus.CONFLICT, quarantineId, message);
    }

    public SyncBatchResponseDto toBatchResponse(int total, int success, int conflict, int skipped,
            List<SyncItemResultDto> results) {
        return SyncBatchResponseDto.builder()
                .totalProcessed(total)
                .successCount(success)
                .conflictCount(conflict)
                .skippedCount(skipped)
                .results(results != null ? results : new ArrayList<>())
                .build();
    }

    public void applyPayloadToWorkOrder(WorkOrder order, String payloadJson) {
        if (order == null || payloadJson == null || payloadJson.isBlank()) {
            return;
        }

        try {
            JsonNode root = objectMapper.readTree(payloadJson);

            getOptionalString(root, "status").ifPresent(statusStr -> {
                try {
                    order.setStatus(WorkOrderStatus.valueOf(statusStr));
                } catch (IllegalArgumentException ignored) {
                    log.warn("Ismeretlen WorkOrderStatus érték: {}", statusStr);
                }
            });

            getOptionalString(root, "priority").ifPresent(priorityStr -> {
                try {
                    order.setPriority(WorkOrderPriority.valueOf(priorityStr));
                } catch (IllegalArgumentException ignored) {
                    log.warn("Ismeretlen WorkOrderPriority érték: {}", priorityStr);
                }
            });

            getOptionalDecimal(root, "producedQuantity").ifPresent(order::setProducedQuantity);
            getOptionalDecimal(root, "scrapQuantity").ifPresent(order::setScrapQuantity);
            getOptionalString(root, "customerName").ifPresent(order::setCustomerName);

        } catch (Exception e) {
            log.error("Hiba történt a WorkOrder payload feldolgozásakor: {}", payloadJson, e);
            throw new IllegalArgumentException("Érvénytelen JSON adattartalom a munkarendeléshez: " + e.getMessage());
        }
    }

    public void applyPayloadToInventory(Inventory inventory, String payloadJson) {
        if (inventory == null || payloadJson == null || payloadJson.isBlank()) {
            return;
        }

        try {
            JsonNode root = objectMapper.readTree(payloadJson);

            getOptionalDecimal(root, "quantity").ifPresent(inventory::setQuantity);
            getOptionalDecimal(root, "reservedQuantity").ifPresent(inventory::setReservedQuantity);
            getOptionalString(root, "location").ifPresent(inventory::setLocation);

        } catch (Exception e) {
            log.error("Hiba történt az Inventory payload feldolgozásakor: {}", payloadJson, e);
            throw new IllegalArgumentException("Érvénytelen JSON adattartalom a készlethez: " + e.getMessage());
        }
    }

    public String serializeToJson(Object obj) {
        if (obj == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            log.warn("Nem sikerült JSON-be szerializálni az objektumot: {}", e.getMessage());
            return null;
        }
    }

    private Optional<String> getOptionalString(JsonNode root, String fieldName) {
        if (root.has(fieldName) && !root.get(fieldName).isNull()) {
            return Optional.of(root.get(fieldName).asText());
        }
        return Optional.empty();
    }

    private Optional<BigDecimal> getOptionalDecimal(JsonNode root, String fieldName) {
        if (root.has(fieldName) && !root.get(fieldName).isNull()) {
            return Optional.of(root.get(fieldName).decimalValue());
        }
        return Optional.empty();
    }
}
