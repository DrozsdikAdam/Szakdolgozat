package hu.mes.backend.dtos.machine;

import hu.mes.backend.models.enums.MachineStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MachineStatusUpdateRequest {

    @NotNull(message = "Az új állapot kötelező!")
    private MachineStatus status;

}
