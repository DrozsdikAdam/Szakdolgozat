package hu.mes.backend.dtos.maintenance;

import java.math.BigDecimal;

import hu.mes.backend.models.enums.MaintenanceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MachineMaintenanceStatusUpdateRequest {

    @NotNull(message = "Az új státusz kötelező!")
    private MaintenanceStatus status;
    private String rootCause;
    private String actionTaken;
    private Integer downtimeMinutes;
    private BigDecimal cost;

}
