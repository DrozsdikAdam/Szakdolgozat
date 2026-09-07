package hu.mes.backend.dtos.maintenance;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import hu.mes.backend.models.enums.MaintenanceStatus;
import hu.mes.backend.models.enums.MaintenanceType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class MachineMaintenanceCreateRequest {

    private UUID id;
    @NotNull(message = "A gép kijelölése kötelező!")
    private UUID machineId;
    private String machineCode;
    private String machineName;
    private UUID technicianId;
    private String technicianName;
    @NotBlank(message = "A karbantartás címe kötelező!")
    private String title;
    private String description;
    private String rootCause;
    private String actionTaken;
    @NotNull(message = "A karbantartás állapota kötelező!")
    private MaintenanceStatus status;
    @NotNull(message = "A karbantartás típusa kötelező!")
    private MaintenanceType type;
    @Min(value = 0, message = "A leállási idő nem lehet negatív!")
    private Integer downtimeMinutes;
    @Min(value = 0, message = "A költség nem lehet negatív!")
    private BigDecimal cost;
    private LocalDateTime start;
    private LocalDateTime end;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}
