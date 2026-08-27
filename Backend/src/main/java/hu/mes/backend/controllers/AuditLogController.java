package hu.mes.backend.controllers;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import hu.mes.backend.dtos.audit.AuditLogResponse;
import hu.mes.backend.models.enums.AuditEntityType;
import hu.mes.backend.services.AuditLogService;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<List<AuditLogResponse>> getAllLogs() {
        return ResponseEntity.ok(auditLogService.getRecentLogs());
    }

    @GetMapping("/recent")
    public ResponseEntity<List<AuditLogResponse>> getRecentLogs() {
        return ResponseEntity.ok(auditLogService.getRecentLogs());
    }

    @GetMapping("/entity/{type}")
    public ResponseEntity<List<AuditLogResponse>> getLogsByEntityType(@PathVariable AuditEntityType type) {
        return ResponseEntity.ok(auditLogService.getLogsByEntityType(type));
    }

}
