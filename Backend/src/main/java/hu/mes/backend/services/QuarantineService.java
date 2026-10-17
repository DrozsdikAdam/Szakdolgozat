package hu.mes.backend.services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import hu.mes.backend.dtos.sync.ConflictResolutionRequest;
import hu.mes.backend.dtos.sync.QuarantineItemResponse;
import hu.mes.backend.dtos.sync.SyncItemDto;
import hu.mes.backend.mappers.QuarantineMapper;
import hu.mes.backend.models.QuarantineQueue;
import hu.mes.backend.models.enums.QuarantineStatus;
import hu.mes.backend.models.enums.ResolutionStrategy;
import hu.mes.backend.repositories.InventoryRepository;
import hu.mes.backend.repositories.QuarantineQueueRepository;
import hu.mes.backend.repositories.WorkOrderRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class QuarantineService {

    public static final String ENTITY_WORK_ORDER = "WorkOrder";
    public static final String ENTITY_INVENTORY = "Inventory";
    public static final String DEFAULT_RESOLVER = "system";

    private final QuarantineQueueRepository repository;
    private final QuarantineMapper mapper;
    private final WorkOrderRepository workOrderRepository;
    private final InventoryRepository inventoryRepository;

    public List<QuarantineItemResponse> getPendingConflicts() {
        List<QuarantineQueue> conflicts = repository.findByStatusOrderByCreatedAtDesc(QuarantineStatus.CONFLICT);
        return mapper.convertToResponses(conflicts);
    }

    public Page<QuarantineItemResponse> getPendingConflicts(Pageable pageable) {
        Page<QuarantineQueue> page = repository.findByStatusOrderByCreatedAtDesc(QuarantineStatus.CONFLICT, pageable);
        return page.map(mapper::convertToResponse);
    }

    public QuarantineItemResponse getConflictById(UUID id) {
        QuarantineQueue quarantine = findQuarantineById(id);
        return mapper.convertToResponse(quarantine);
    }

    public Long getPendingConflictCount() {
        return repository.countByStatus(QuarantineStatus.CONFLICT);
    }

    public List<QuarantineItemResponse> getConflictsByEntity(String entityName, String entityId) {
        List<QuarantineQueue> list = repository.findByEntityNameAndEntityIdOrderByCreatedAtDesc(entityName, entityId);
        return mapper.convertToResponses(list);
    }

    public boolean isOperationProcessed(String operationId) {
        if (operationId == null || operationId.isBlank()) {
            return false;
        }
        return repository.existsByOperationId(operationId);
    }

    @Transactional
    public QuarantineQueue createQuarantineRecord(SyncItemDto item, String serverState, String errorMsg) {
        QuarantineQueue quarantine = QuarantineQueue.builder()
                .operationId(item.getOperationId())
                .entityName(item.getEntityName())
                .entityId(item.getEntityId())
                .httpMethod(item.getHttpMethod())
                .endpointUrl(item.getEndpointUrl())
                .payloadJson(item.getPayloadJson())
                .serverStateJson(serverState)
                .errorMessage(errorMsg)
                .status(QuarantineStatus.CONFLICT)
                .retryCount(0)
                .build();

        return repository.save(quarantine);
    }

    @Transactional
    public QuarantineItemResponse resolveConflict(UUID id, ConflictResolutionRequest request) {
        validateResolutionRequest(request);

        QuarantineQueue quarantine = findQuarantineById(id);
        validateQuarantineStatus(quarantine);

        ResolutionStrategy strategy = request.getStrategy();
        switch (strategy) {
            case CLIENT_WINS -> applyClientWins(quarantine);
            case SERVER_WINS -> applyServerWins(quarantine);
            case MANUAL_MERGE -> applyManualMerge(quarantine, request.getMergedPayloadJson());
        }

        quarantine.setResolutionStrategy(strategy);
        quarantine.setResolvedBy(request.getResolvedBy() != null ? request.getResolvedBy() : DEFAULT_RESOLVER);
        quarantine.setResolvedAt(LocalDateTime.now());

        QuarantineQueue saved = repository.save(quarantine);
        log.info("Karantén tétel feloldva: id={}, stratégia={}, feloldó={}", id, strategy, quarantine.getResolvedBy());

        return mapper.convertToResponse(saved);
    }

    private void applyClientWins(QuarantineQueue quarantine) {
        applyPayloadToEntity(quarantine, quarantine.getPayloadJson());
        quarantine.setStatus(QuarantineStatus.RESOLVED);
    }

    private void applyServerWins(QuarantineQueue quarantine) {
        quarantine.setStatus(QuarantineStatus.DISCARDED);
    }

    private void applyManualMerge(QuarantineQueue quarantine, String mergedPayloadJson) {
        if (mergedPayloadJson == null || mergedPayloadJson.isBlank()) {
            throw new IllegalArgumentException("A MANUAL_MERGE stratégia esetén a mergedPayloadJson nem lehet üres!");
        }

        applyPayloadToEntity(quarantine, mergedPayloadJson);
        quarantine.setStatus(QuarantineStatus.RESOLVED);
    }

    private void applyPayloadToEntity(QuarantineQueue quarantine, String payloadJson) {
        Optional<UUID> entityIdOpt = tryParseUUID(quarantine.getEntityId());
        if (entityIdOpt.isEmpty()) {
            return;
        }

        UUID entityId = entityIdOpt.get();

        if (ENTITY_WORK_ORDER.equalsIgnoreCase(quarantine.getEntityName())) {
            workOrderRepository.findById(entityId).ifPresent(order -> {
                mapper.applyPayloadToWorkOrder(order, payloadJson);
                workOrderRepository.save(order);
            });
        } else if (ENTITY_INVENTORY.equalsIgnoreCase(quarantine.getEntityName())) {
            inventoryRepository.findById(entityId).ifPresent(inventory -> {
                mapper.applyPayloadToInventory(inventory, payloadJson);
                inventoryRepository.save(inventory);
            });
        }
    }

    private void validateResolutionRequest(ConflictResolutionRequest request) {
        if (request == null || request.getStrategy() == null) {
            throw new IllegalArgumentException("A feloldási stratégia megadása kötelező!");
        }
    }

    private void validateQuarantineStatus(QuarantineQueue quarantine) {
        if (quarantine.getStatus() != QuarantineStatus.CONFLICT) {
            throw new IllegalStateException(
                    "Ez a karanténtétel már feloldásra került korábban: " + quarantine.getStatus());
        }
    }

    private QuarantineQueue findQuarantineById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Karantén rekord nem található a következő azonosítóval: " + id));
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
