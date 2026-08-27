package hu.mes.backend.dtos.maintenance;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import hu.mes.backend.models.enums.MaintenanceStatus;
import hu.mes.backend.models.enums.MaintenanceType;
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
public class MachineMaintenanceResponse {

    private UUID id;
    private UUID machineId;
    private String machineCode;
    private String machineName;
    private UUID technicianId;
    private String technicianName;
    private String title;
    private String description;
    private String rootCause;
    private String actionTaken;
    private MaintenanceStatus status;
    private MaintenanceType type;
    private Integer downtimeMinutes;
    private BigDecimal cost;
    private LocalDateTime start;
    private LocalDateTime end;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}
