package hu.mes.backend.services;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import hu.mes.backend.dtos.sync.SyncBatchRequestDto;
import hu.mes.backend.dtos.sync.SyncBatchResponseDto;
import hu.mes.backend.dtos.sync.SyncItemDto;
import hu.mes.backend.dtos.sync.SyncItemResultDto;
import hu.mes.backend.mappers.QuarantineMapper;
import hu.mes.backend.models.Inventory;
import hu.mes.backend.models.QuarantineQueue;
import hu.mes.backend.models.WorkOrder;
import hu.mes.backend.models.enums.SyncItemStatus;
import hu.mes.backend.repositories.InventoryRepository;
import hu.mes.backend.repositories.WorkOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class OfflineSyncService {

    public static final String ENTITY_WORK_ORDER = "WorkOrder";
    public static final String ENTITY_INVENTORY = "Inventory";

    private final QuarantineService quarantineService;
    private final QuarantineMapper mapper;
    private final WorkOrderRepository workOrderRepository;
    private final InventoryRepository inventoryRepository;

    @Transactional
    public SyncBatchResponseDto processOfflineBatch(SyncBatchRequestDto request) {
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            return mapper.toBatchResponse(0, 0, 0, 0, new ArrayList<>());
        }

        List<SyncItemResultDto> results = new ArrayList<>();
        int successCount = 0;
        int conflictCount = 0;
        int skippedCount = 0;

        for (SyncItemDto item : request.getItems()) {
            SyncItemResultDto result = processSingleItem(item);
            results.add(result);

            if (result.getStatus() == SyncItemStatus.APPLIED) {
                successCount++;
            } else if (result.getStatus() == SyncItemStatus.CONFLICT) {
                conflictCount++;
            } else if (result.getStatus() == SyncItemStatus.SKIPPED) {
                skippedCount++;
            }
        }

        log.info("Offline batch feldolgozva: összesen={}, sikeres={}, ütközés={}, kihagyva={}",
                request.getItems().size(), successCount, conflictCount, skippedCount);

        return mapper.toBatchResponse(request.getItems().size(), successCount, conflictCount, skippedCount, results);
    }

    private SyncItemResultDto processSingleItem(SyncItemDto item) {
        if (quarantineService.isOperationProcessed(item.getOperationId())) {
            log.warn("Művelet már korábban feldolgozva (idempotens kihagyás): {}", item.getOperationId());
            return mapper.toSkippedResult(item);
        }

        try {
            if (ENTITY_WORK_ORDER.equalsIgnoreCase(item.getEntityName())) {
                return processWorkOrderItem(item);
            }

            if (ENTITY_INVENTORY.equalsIgnoreCase(item.getEntityName())) {
                return processInventoryItem(item);
            }

            return quarantineAndReturnConflict(item, null,
                    "Nem támogatott entitástípus: " + item.getEntityName());

        } catch (Exception ex) {
            log.error("Váratlan hiba szinkronizáció közben: {}", item.getOperationId(), ex);
            return quarantineAndReturnConflict(item, null,
                    "Váratlan hiba miatt karanténba helyezve: " + ex.getMessage());
        }
    }

    private SyncItemResultDto processWorkOrderItem(SyncItemDto item) {
        Optional<UUID> workOrderIdOpt = tryParseUUID(item.getEntityId());
        if (workOrderIdOpt.isEmpty()) {
            return quarantineAndReturnConflict(item, null,
                    "Érvénytelen vagy hiányzó WorkOrder UUID azonosító: " + item.getEntityId());
        }

        var workOrderOpt = workOrderRepository.findById(workOrderIdOpt.get());
        if (workOrderOpt.isEmpty()) {
            return quarantineAndReturnConflict(item, null,
                    "A megcélzott munkarendelés nem található az adatbázisban.");
        }

        WorkOrder currentOrder = workOrderOpt.get();
        String currentServerState = mapper.serializeToJson(currentOrder);

        if (item.getClientVersion() != null && !item.getClientVersion().equals(currentOrder.getVersion())) {
            String errorMsg = String.format(
                    "Verzió-ütközés (Optimistic Lock Failure): A kliens verzió (%d) eltér a szerververziótól (%d).",
                    item.getClientVersion(), currentOrder.getVersion());
            log.warn("Munkarendelés konfliktus: {} -> {}", item.getOperationId(), errorMsg);
            return quarantineAndReturnConflict(item, currentServerState, errorMsg);
        }

        mapper.applyPayloadToWorkOrder(currentOrder, item.getPayloadJson());
        workOrderRepository.save(currentOrder);

        return mapper.toAppliedResult(item);
    }

    private SyncItemResultDto processInventoryItem(SyncItemDto item) {
        Optional<UUID> inventoryIdOpt = tryParseUUID(item.getEntityId());
        if (inventoryIdOpt.isEmpty()) {
            return quarantineAndReturnConflict(item, null,
                    "Érvénytelen vagy hiányzó Inventory UUID azonosító: " + item.getEntityId());
        }

        var inventoryOpt = inventoryRepository.findById(inventoryIdOpt.get());
        if (inventoryOpt.isEmpty()) {
            return quarantineAndReturnConflict(item, null,
                    "A megcélzott készlet rekord nem található az adatbázisban.");
        }

        Inventory currentInventory = inventoryOpt.get();
        String currentServerState = mapper.serializeToJson(currentInventory);

        if (item.getClientVersion() != null && currentInventory.getVersion() != null
                && item.getClientVersion().longValue() != currentInventory.getVersion()) {
            String errorMsg = String.format(
                    "Verzió-ütközés (Készlet Optimistic Lock): A kliens verzió (%d) eltér a szerververziótól (%d).",
                    item.getClientVersion(), currentInventory.getVersion());
            log.warn("Készlet konfliktus: {} -> {}", item.getOperationId(), errorMsg);
            return quarantineAndReturnConflict(item, currentServerState, errorMsg);
        }

        mapper.applyPayloadToInventory(currentInventory, item.getPayloadJson());
        inventoryRepository.save(currentInventory);

        return mapper.toAppliedResult(item);
    }

    private SyncItemResultDto quarantineAndReturnConflict(SyncItemDto item, String serverState, String errorMsg) {
        QuarantineQueue quarantine = quarantineService.createQuarantineRecord(item, serverState, errorMsg);
        return mapper.toConflictResult(item, quarantine.getId(), errorMsg);
    }

    private Optional<UUID> tryParseUUID(String idStr) {
        if (idStr == null || idStr.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(UUID.fromString(idStr.trim()));
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
