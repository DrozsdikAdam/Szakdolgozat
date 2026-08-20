package hu.mes.backend.dtos.machine;

import java.time.LocalDateTime;
import java.util.UUID;

import hu.mes.backend.models.enums.MachineStatus;
import hu.mes.backend.models.enums.MachineType;
import jakarta.validation.constraints.NotBlank;
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
public class MachineCreateRequest {

    @NotBlank(message = "A gép kódja kötelező!")
    private String code;
    @NotBlank(message = "A gép neve kötelező!")
    private String name;
    @NotNull(message = "A gép típusa kötelező!")
    private MachineType type;
    @NotNull(message = "A gép állapota kötelező!")
    private MachineStatus status;
    private String manufacturer;
    private String model;
    private String serialNumber;
    private String warrantyNumber;
    private LocalDateTime warrantyEndDate;
    @NotNull(message = "Az ideális ciklusidő kötelező!")
    private Double idealCycleTimeSeconds;
    @NotNull(message = "A tervezett darabszám per óra kötelező!")
    private Integer targetPcsPerHour;
    private String location;
    private UUID assignedUserId;

}
