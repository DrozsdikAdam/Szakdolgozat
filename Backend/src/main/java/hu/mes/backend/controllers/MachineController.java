package hu.mes.backend.controllers;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import hu.mes.backend.dtos.machine.EmergencyStopRequest;
import hu.mes.backend.dtos.machine.MachineCreateRequest;
import hu.mes.backend.dtos.machine.MachineResponse;
import hu.mes.backend.dtos.machine.MachineStatusUpdateRequest;
import hu.mes.backend.dtos.machine.MachineUpdateRequest;
import hu.mes.backend.models.enums.MachineStatus;
import hu.mes.backend.models.enums.MachineType;
import hu.mes.backend.services.MachineService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api/machines")
@RequiredArgsConstructor
public class MachineController {

    private final MachineService machineService;

    @GetMapping
    public ResponseEntity<List<MachineResponse>> getAllMachines() {
        List<MachineResponse> responses = machineService.getAllMachines();
        return ResponseEntity.status(HttpStatus.OK).body(responses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MachineResponse> getMachineById(@PathVariable UUID id) {
        MachineResponse response = machineService.getMachineById(id);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<MachineResponse>> getMachinesByStatus(@PathVariable MachineStatus status) {
        List<MachineResponse> responses = machineService.getMachinesByStatus(status);
        return ResponseEntity.status(HttpStatus.OK).body(responses);
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<MachineResponse>> getMachinesByType(@PathVariable MachineType type) {
        List<MachineResponse> responses = machineService.getMachinesByType(type);
        return ResponseEntity.status(HttpStatus.OK).body(responses);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<MachineResponse>> getMachinesByUser(@PathVariable UUID userId) {
        List<MachineResponse> responses = machineService.getMachinesByUserId(userId);
        return ResponseEntity.status(HttpStatus.OK).body(responses);
    }

    @GetMapping("/deleted")
    public ResponseEntity<List<MachineResponse>> getDeletedMachines() {
        List<MachineResponse> responses = machineService.getDeletedMachines();
        return ResponseEntity.status(HttpStatus.OK).body(responses);
    }

    @GetMapping("/inactive")
    public ResponseEntity<List<MachineResponse>> getInactiveMachines() {
        List<MachineResponse> responses = machineService.getInactiveMachines();
        return ResponseEntity.status(HttpStatus.OK).body(responses);
    }

    @PostMapping
    public ResponseEntity<MachineResponse> createMachine(@Valid @RequestBody MachineCreateRequest request) {
        MachineResponse newMachine = machineService.createMachine(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(newMachine);
    }

    @PostMapping("/{id}/emergency-stop")
    public ResponseEntity<MachineResponse> emergencyStop(@PathVariable UUID id,
            @Valid @RequestBody EmergencyStopRequest request) {
        MachineResponse updatedMachine = machineService.emergencyStop(id, request);
        return ResponseEntity.status(HttpStatus.OK).body(updatedMachine);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<MachineResponse> updateMachine(@PathVariable UUID id,
            @Valid @RequestBody MachineUpdateRequest request) {
        MachineResponse updatedMachine = machineService.updateMachine(id, request);
        return ResponseEntity.status(HttpStatus.OK).body(updatedMachine);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<MachineResponse> updateMachineStatus(
            @PathVariable UUID id,
            @Valid @RequestBody MachineStatusUpdateRequest request) {
        MachineResponse updatedMachine = machineService.updateMachineStatus(id, request.getStatus());
        return ResponseEntity.status(HttpStatus.OK).body(updatedMachine);
    }

    @PatchMapping("/{id}/user/{userId}")
    public ResponseEntity<MachineResponse> updateMachineUser(@PathVariable UUID id, @PathVariable UUID userId) {
        MachineResponse updatedMachine = machineService.updateMachineUser(id, userId);
        return ResponseEntity.status(HttpStatus.OK).body(updatedMachine);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivateMachine(@PathVariable UUID id) {
        machineService.deactivateMachine(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<Void> activateMachine(@PathVariable UUID id) {
        machineService.activateMachine(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @PatchMapping("/{id}/restore")
    public ResponseEntity<Void> restoreMachine(@PathVariable UUID id) {
        machineService.restoreMachine(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @DeleteMapping("/{id}/user")
    public ResponseEntity<MachineResponse> unassignMachine(@PathVariable UUID id) {
        MachineResponse updatedMachine = machineService.unassignMachine(id);
        return ResponseEntity.status(HttpStatus.OK).body(updatedMachine);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMachine(@PathVariable UUID id) {
        machineService.deleteMachine(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

}
