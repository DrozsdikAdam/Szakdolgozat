package hu.mes.backend.dtos.machine;

import java.time.LocalDateTime;
import java.util.UUID;

import hu.mes.backend.models.enums.MachineStatus;
import hu.mes.backend.models.enums.MachineType;
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
public class MachineResponse {

    private UUID id;
    private String code;
    private String name;
    private MachineType type;
    private MachineStatus status;
    private String manufacturer;
    private String model;
    private String serialNumber;
    private String warrantyNumber;
    private LocalDateTime warrantyEndDate;
    private Double idealCycleTimeSeconds;
    private Integer targetPcsPerHour;
    private String location;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID assignedUserId;
    private String assignedUserName;

}
