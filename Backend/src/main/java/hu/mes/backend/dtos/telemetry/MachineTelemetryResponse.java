package hu.mes.backend.dtos.telemetry;

import java.time.LocalDateTime;
import java.util.UUID;

import hu.mes.backend.models.enums.MachineStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MachineTelemetryResponse {

    private UUID id;
    private UUID machineId;
    private String machineName;
    private LocalDateTime timestamp;
    private MachineStatus status;
    private Integer producedCount;
    private Integer scrapCount;
    private Double temperature;
    private Double vibration;
    private Double powerKw;
    private Double pressureBar;
    private UUID activeWorkOrderId;
    private String activeWorkOrderNumber;

}
