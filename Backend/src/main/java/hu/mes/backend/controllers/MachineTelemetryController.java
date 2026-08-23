package hu.mes.backend.controllers;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import hu.mes.backend.dtos.telemetry.MachineTelemetryResponse;
import hu.mes.backend.dtos.telemetry.OeeResponse;
import hu.mes.backend.mappers.TelemetryMapper;
import hu.mes.backend.models.MachineTelemetry;
import hu.mes.backend.repositories.MachineTelemetryRepository;
import hu.mes.backend.services.OeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/telemetry")
public class MachineTelemetryController {

    private final MachineTelemetryRepository telemetryRepository;
    private final OeeService oeeService;
    private final TelemetryMapper telemetryMapper;

    @GetMapping("/machine/{machineId}/latest")
    public ResponseEntity<MachineTelemetryResponse> getLatestTelemetry(@PathVariable UUID machineId) {
        MachineTelemetry latest = telemetryRepository.findTopByMachineIdOrderByTimestampDesc(machineId)
                .orElse(null);

        if (latest == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(telemetryMapper.convertToResponse(latest));

    }

    @GetMapping("/machine/{machineId}/history")
    public ResponseEntity<List<MachineTelemetryResponse>> getTelemetryHistory(@PathVariable UUID machineId) {
        List<MachineTelemetry> telemetries = telemetryRepository.findTop50ByMachineIdOrderByTimestampDesc(machineId);

        if (telemetries.isEmpty())
            return ResponseEntity.notFound().build();

        return ResponseEntity.ok(telemetryMapper.convertToResponses(telemetries));
    }

    @GetMapping("/machine/{machineId}/oee")
    public ResponseEntity<OeeResponse> getMachineOee(@PathVariable UUID machineId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {

        if (start == null)
            start = LocalDateTime.now().minusHours(24);
        if (end == null)
            end = LocalDateTime.now();

        OeeResponse oee = oeeService.calculateMachineOee(machineId, start, end);

        if (oee == null)
            return ResponseEntity.notFound().build();

        return ResponseEntity.ok(oee);
    }
}
