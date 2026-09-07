package hu.mes.backend.mappers;

import java.util.List;

import org.springframework.stereotype.Component;

import hu.mes.backend.dtos.machine.MachineResponse;
import hu.mes.backend.models.Machine;

@Component
public class MachineMapper {

    public MachineResponse convertToResponse(Machine machine) {
        return MachineResponse.builder()
                .id(machine.getId())
                .code(machine.getCode())
                .name(machine.getName())
                .type(machine.getType())
                .status(machine.getStatus())
                .manufacturer(machine.getManufacturer())
                .model(machine.getModel())
                .serialNumber(machine.getSerialNumber())
                .warrantyNumber(machine.getWarrantyNumber())
                .warrantyEndDate(machine.getWarrantyEndDate())
                .idealCycleTimeSeconds(machine.getIdealCycleTimeSeconds())
                .targetPcsPerHour(machine.getTargetPcsPerHour())
                .location(machine.getLocation())
                .active(machine.getActive())
                .createdAt(machine.getCreatedAt())
                .updatedAt(machine.getUpdatedAt())
                .assignedUserId(machine.getAssignedUser() != null ? machine.getAssignedUser().getId() : null)
                .assignedUserName(machine.getAssignedUser() != null ? machine.getAssignedUser().getName() : null)
                .build();
    }

    public List<MachineResponse> convertToResponses(List<Machine> machines) {
        return machines.stream().map(this::convertToResponse).toList();
    }

}
