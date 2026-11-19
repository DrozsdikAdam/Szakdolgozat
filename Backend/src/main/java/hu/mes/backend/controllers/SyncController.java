package hu.mes.backend.controllers;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import hu.mes.backend.dtos.common.PagedResponse;
import hu.mes.backend.dtos.sync.ConflictResolutionRequest;
import hu.mes.backend.dtos.sync.QuarantineItemResponse;
import hu.mes.backend.dtos.sync.SyncBatchRequestDto;
import hu.mes.backend.dtos.sync.SyncBatchResponseDto;
import hu.mes.backend.models.enums.ResolutionStrategy;
import hu.mes.backend.services.OfflineSyncService;
import hu.mes.backend.services.QuarantineService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/sync")
@RequiredArgsConstructor
@Slf4j
public class SyncController {

    private final OfflineSyncService offlineSyncService;
    private final QuarantineService quarantineService;

    @PostMapping("/offline")
    public ResponseEntity<SyncBatchResponseDto> processOfflineBatch(
            @Valid @RequestBody SyncBatchRequestDto request,
            Authentication authentication) {

        if ((request.getSubmittedBy() == null || request.getSubmittedBy().isBlank()) && authentication != null) {
            request.setSubmittedBy(authentication.getName());
        }

        log.info("Offline szinkronizációs köteg érkezett (tételek száma: {}, beküldő: {})",
                request.getItems() != null ? request.getItems().size() : 0, request.getSubmittedBy());

        SyncBatchResponseDto response = offlineSyncService.processOfflineBatch(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/quarantine")
    public ResponseEntity<PagedResponse<QuarantineItemResponse>> getPendingConflicts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<QuarantineItemResponse> pagedResult = quarantineService.getPendingConflicts(PageRequest.of(page, size));
        return ResponseEntity.ok(PagedResponse.of(pagedResult));
    }

    @GetMapping("/quarantine/all")
    public ResponseEntity<List<QuarantineItemResponse>> getAllPendingConflicts() {
        return ResponseEntity.ok(quarantineService.getPendingConflicts());
    }

    @GetMapping("/quarantine/count")
    public ResponseEntity<Long> getPendingConflictCount() {
        return ResponseEntity.ok(quarantineService.getPendingConflictCount());
    }

    @GetMapping("/quarantine/{id}")
    public ResponseEntity<QuarantineItemResponse> getConflictById(@PathVariable UUID id) {
        return ResponseEntity.ok(quarantineService.getConflictById(id));
    }

    @GetMapping("/quarantine/entity/{entityName}/{entityId}")
    public ResponseEntity<List<QuarantineItemResponse>> getConflictsByEntity(
            @PathVariable String entityName,
            @PathVariable String entityId) {

        return ResponseEntity.ok(quarantineService.getConflictsByEntity(entityName, entityId));
    }

    @PostMapping("/quarantine/{id}/resolve")
    public ResponseEntity<QuarantineItemResponse> resolveConflict(
            @PathVariable UUID id,
            @Valid @RequestBody ConflictResolutionRequest request,
            Authentication authentication) {

        if ((request.getResolvedBy() == null || request.getResolvedBy().isBlank()) && authentication != null) {
            request.setResolvedBy(authentication.getName());
        }

        log.info("Konfliktusfeloldási kérés érkezett: tétel={}, stratégia={}, feloldó={}",
                id, request.getStrategy(), request.getResolvedBy());

        QuarantineItemResponse resolved = quarantineService.resolveConflict(id, request);
        return ResponseEntity.ok(resolved);
    }

    @DeleteMapping("/quarantine/{id}")
    public ResponseEntity<Void> discardConflict(
            @PathVariable UUID id,
            Authentication authentication) {

        String resolvedBy = authentication != null ? authentication.getName() : "system";

        log.info("Karantén tétel elvetési kérés: tétel={}, elvető={}", id, resolvedBy);

        quarantineService.resolveConflict(id, ConflictResolutionRequest.builder()
                .strategy(ResolutionStrategy.SERVER_WINS)
                .resolvedBy(resolvedBy)
                .build());

        return ResponseEntity.noContent().build();
    }
}
