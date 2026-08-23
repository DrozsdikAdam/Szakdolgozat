package hu.mes.backend.mappers;

import java.util.List;

import org.springframework.stereotype.Component;

import hu.mes.backend.dtos.maintenance.MachineMaintenanceResponse;
import hu.mes.backend.models.MachineMaintenance;

@Component
public class MaintenanceMapper {

    public MachineMaintenanceResponse convertToResponse(MachineMaintenance maintenance) {
        return MachineMaintenanceResponse.builder()
                .id(maintenance.getId())
                .machineId(maintenance.getMachine().getId())
                .machineCode(maintenance.getMachine().getCode())
                .machineName(maintenance.getMachine().getName())
                .technicianId(maintenance.getTechnician() != null ? maintenance.getTechnician().getId() : null)
                .technicianName(maintenance.getTechnician() != null ? maintenance.getTechnician().getName() : null)
                .title(maintenance.getTitle())
                .description(maintenance.getDescription())
                .rootCause(maintenance.getRootCause())
                .actionTaken(maintenance.getActionTaken())
                .status(maintenance.getStatus())
                .type(maintenance.getType())
                .downtimeMinutes(maintenance.getDowntimeMinutes())
                .cost(maintenance.getCost())
                .start(maintenance.getStart())
                .end(maintenance.getEnd())
                .createdAt(maintenance.getCreatedAt())
                .updatedAt(maintenance.getUpdatedAt())
                .build();
    }

    public List<MachineMaintenanceResponse> convertToResponses(List<MachineMaintenance> maintenances) {
        return maintenances.stream().map(this::convertToResponse).toList();
    }

}
