package hu.mes.backend.dtos.machine;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
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
public class EmergencyStopRequest {

    @NotBlank(message = "A megállás oka kötelező!")
    private String reason;

    private String description;

    private UUID technicianId;

}
