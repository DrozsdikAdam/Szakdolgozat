package hu.mes.backend.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import hu.mes.backend.models.MachineMaintenance;
import hu.mes.backend.models.enums.MaintenanceStatus;

@Repository
public interface MachineMaintenanceRepository extends JpaRepository<MachineMaintenance, UUID> {

    List<MachineMaintenance> findByMachineId(UUID machineId);

    List<MachineMaintenance> findByTechnicianId(UUID technicianId);

    List<MachineMaintenance> findByStatus(MaintenanceStatus status);

    List<MachineMaintenance> findByMachineIdAndStatus(UUID machineId, MaintenanceStatus status);

}
