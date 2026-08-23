package hu.mes.backend.mappers;

import java.util.List;

import org.springframework.stereotype.Component;

import hu.mes.backend.dtos.telemetry.MachineTelemetryResponse;
import hu.mes.backend.models.MachineTelemetry;

@Component
public class TelemetryMapper {

    public MachineTelemetryResponse toResponse(MachineTelemetry telemetry) {
        return MachineTelemetryResponse.builder()
                .id(telemetry.getId())
                .machineId(telemetry.getMachine().getId())
                .machineName(telemetry.getMachine().getName())
                .timestamp(telemetry.getTimestamp())
                .status(telemetry.getStatus())
                .producedCount(telemetry.getProducedCount())
                .scrapCount(telemetry.getScrapCount())
                .temperature(telemetry.getTemperature())
                .vibration(telemetry.getVibration())
                .powerKw(telemetry.getPowerKw())
                .pressureBar(telemetry.getPressureBar())
                .activeWorkOrderId(
                        telemetry.getActiveWorkOrder() != null ? telemetry.getActiveWorkOrder().getId() : null)
                .activeWorkOrderNumber(
                        telemetry.getActiveWorkOrder() != null ? telemetry.getActiveWorkOrder().getOrderNumber() : null)
                .build();
    }

    public List<MachineTelemetryResponse> toResponse(List<MachineTelemetry> telemetries) {
        return telemetries.stream().map(this::toResponse).toList();
    }

}
