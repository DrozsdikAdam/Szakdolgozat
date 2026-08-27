package hu.mes.backend.controllers;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import hu.mes.backend.dtos.maintenance.MachineMaintenanceCreateRequest;
import hu.mes.backend.dtos.maintenance.MachineMaintenanceResponse;
import hu.mes.backend.dtos.maintenance.MachineMaintenanceStatusUpdateRequest;
import hu.mes.backend.dtos.maintenance.MachineMaintenanceUpdateRequest;
import hu.mes.backend.models.enums.MaintenanceStatus;
import hu.mes.backend.services.MachineMaintenanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api/maintenance")
@RequiredArgsConstructor
public class MachineMaintenanceController {

    private final MachineMaintenanceService machineMaintenanceService;

    @GetMapping
    public ResponseEntity<List<MachineMaintenanceResponse>> getAllMaintenances() {
        List<MachineMaintenanceResponse> response = machineMaintenanceService.getAllMaintenances();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MachineMaintenanceResponse> getMaintenanceById(@PathVariable UUID id) {
        MachineMaintenanceResponse response = machineMaintenanceService.getMaintenanceById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/machine/{machineId}")
    public ResponseEntity<List<MachineMaintenanceResponse>> getMaintenanceByMachineId(@PathVariable UUID machineId) {
        List<MachineMaintenanceResponse> response = machineMaintenanceService.getMaintenanceByMachineId(machineId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/technician/{technicianId}")
    public ResponseEntity<List<MachineMaintenanceResponse>> getMaintenanceByTechnicianId(
            @PathVariable UUID technicianId) {
        List<MachineMaintenanceResponse> response = machineMaintenanceService
                .getMaintenanceByTechnicianId(technicianId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<MachineMaintenanceResponse>> getMaintenanceByStatus(
            @PathVariable MaintenanceStatus status) {
        List<MachineMaintenanceResponse> response = machineMaintenanceService.getMaintenancesByStatus(status);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<MachineMaintenanceResponse> createMaintenance(
            @Valid @RequestBody MachineMaintenanceCreateRequest request) {
        MachineMaintenanceResponse response = machineMaintenanceService.createMaintenance(request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<MachineMaintenanceResponse> updateMaintenance(@PathVariable UUID id,
            @Valid @RequestBody MachineMaintenanceUpdateRequest request) {
        MachineMaintenanceResponse response = machineMaintenanceService.updateMaintenance(id, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<MachineMaintenanceResponse> updateMaintenanceStatus(@PathVariable UUID id,
            @Valid @RequestBody MachineMaintenanceStatusUpdateRequest request) {
        MachineMaintenanceResponse response = machineMaintenanceService.updateMaintenanceStatus(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMaintenance(@PathVariable UUID id) {
        machineMaintenanceService.deleteMaintenance(id);
        return ResponseEntity.noContent().build();
    }

}
