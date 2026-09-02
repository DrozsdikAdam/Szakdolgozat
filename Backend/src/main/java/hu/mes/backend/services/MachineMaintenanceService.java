package hu.mes.backend.services;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import hu.mes.backend.dtos.common.PagedResponse;
import hu.mes.backend.dtos.maintenance.MachineMaintenanceCreateRequest;
import hu.mes.backend.dtos.maintenance.MachineMaintenanceResponse;
import hu.mes.backend.dtos.maintenance.MachineMaintenanceStatusUpdateRequest;
import hu.mes.backend.dtos.maintenance.MachineMaintenanceUpdateRequest;
import hu.mes.backend.mappers.MaintenanceMapper;
import hu.mes.backend.models.Machine;
import hu.mes.backend.models.MachineMaintenance;
import hu.mes.backend.models.User;
import hu.mes.backend.models.enums.AuditAction;
import hu.mes.backend.models.enums.AuditEntityType;
import hu.mes.backend.models.enums.MachineStatus;
import hu.mes.backend.models.enums.MaintenanceStatus;
import hu.mes.backend.models.enums.NotificationType;
import hu.mes.backend.repositories.MachineMaintenanceRepository;
import hu.mes.backend.repositories.MachineRepository;
import hu.mes.backend.repositories.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class MachineMaintenanceService {

    private final MachineMaintenanceRepository machineMaintenanceRepository;
    private final MachineRepository machineRepository;
    private final UserRepository userRepository;
    private final MaintenanceMapper maintenanceMapper;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public PagedResponse<MachineMaintenanceResponse> getAllMaintenances(Pageable pageable) {
        Page<MachineMaintenance> page = machineMaintenanceRepository.findAll(pageable);
        return PagedResponse.of(page, maintenanceMapper.convertToResponses(page.getContent()));
    }

    public List<MachineMaintenanceResponse> getAllMaintenances() {
        List<MachineMaintenance> maintenances = machineMaintenanceRepository.findAll();
        return maintenanceMapper.convertToResponses(maintenances);
    }

    public MachineMaintenanceResponse getMaintenanceById(UUID id) {
        MachineMaintenance maintenance = machineMaintenanceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Karbantartás nem található!"));
        return maintenanceMapper.convertToResponse(maintenance);
    }

    public List<MachineMaintenanceResponse> getMaintenanceByMachineId(UUID id) {
        List<MachineMaintenance> maintenances = machineMaintenanceRepository.findByMachineId(id);
        return maintenanceMapper.convertToResponses(maintenances);
    }

    public List<MachineMaintenanceResponse> getMaintenanceByTechnicianId(UUID id) {
        List<MachineMaintenance> maintenances = machineMaintenanceRepository.findByTechnicianId(id);
        return maintenanceMapper.convertToResponses(maintenances);
    }

    public List<MachineMaintenanceResponse> getMaintenancesByStatus(MaintenanceStatus status) {
        List<MachineMaintenance> maintenances = machineMaintenanceRepository.findByStatus(status);
        return maintenanceMapper.convertToResponses(maintenances);
    }

    public List<MachineMaintenanceResponse> getMaintenancesByMachineIdAndStatus(UUID id,
            MaintenanceStatus status) {
        List<MachineMaintenance> maintenances = machineMaintenanceRepository.findByMachineIdAndStatus(id, status);
        return maintenanceMapper.convertToResponses(maintenances);
    }

    public MachineMaintenanceResponse createMaintenance(MachineMaintenanceCreateRequest request) {
        Machine machine = machineRepository.findById(request.getMachineId())
                .orElseThrow(() -> new EntityNotFoundException("A gép nem található!"));
        User user = request.getTechnicianId() != null
                ? userRepository.findById(request.getTechnicianId()).orElse(null)
                : null;

        if (request.getStatus() == MaintenanceStatus.IN_PROGRESS) {
            machine.setStatus(MachineStatus.MAINTENANCE);
            machineRepository.save(machine);
        }

        if (request.getStatus() == MaintenanceStatus.COMPLETED) {
            machine.setStatus(MachineStatus.IDLE);
            machineRepository.save(machine);
        }

        MachineMaintenance maintenance = MachineMaintenance.builder()
                .machine(machine)
                .technician(user)
                .title(request.getTitle())
                .description(request.getDescription())
                .rootCause(request.getRootCause())
                .actionTaken(request.getActionTaken())
                .status(request.getStatus())
                .type(request.getType())
                .downtimeMinutes(request.getDowntimeMinutes())
                .cost(request.getCost())
                .start(request.getStart())
                .end(request.getEnd())
                .build();

        notificationService.send("Új karbantartási feladat: " + machine.getName(),
                "A karbantartási feladatot kijelölték!" + request.getTitle(),
                NotificationType.INFO,
                "/maintenance");

        auditLogService.log("TECHNICIAN", null, AuditAction.MAINTENANCE_LOG, AuditEntityType.MAINTENANCE,
                machine.getCode(), "Karbantartás rögzítve: " + request.getTitle() + " (" + machine.getName() + ")");

        return maintenanceMapper.convertToResponse(machineMaintenanceRepository.save(maintenance));
    }

    public MachineMaintenanceResponse updateMaintenance(UUID id, MachineMaintenanceUpdateRequest request) {
        MachineMaintenance maintenance = getMaintenanceEntityById(id);
        Machine machine = maintenance.getMachine();
        User user = request.getTechnicianId() != null
                ? userRepository.findById(request.getTechnicianId()).orElse(null)
                : null;

        if (request.getStatus() == MaintenanceStatus.IN_PROGRESS) {
            machine.setStatus(MachineStatus.MAINTENANCE);
            machineRepository.save(machine);
        }

        if (request.getStatus() == MaintenanceStatus.COMPLETED) {
            machine.setStatus(MachineStatus.IDLE);
            machineRepository.save(machine);
        }

        maintenance.setTitle(request.getTitle());
        maintenance.setDescription(request.getDescription());
        maintenance.setType(request.getType());
        maintenance.setTechnician(user);
        maintenance.setStatus(request.getStatus());
        maintenance.setRootCause(request.getRootCause());
        maintenance.setActionTaken(request.getActionTaken());
        maintenance.setDowntimeMinutes(request.getDowntimeMinutes());
        maintenance.setCost(request.getCost());
        maintenance.setStart(request.getStart());
        maintenance.setEnd(request.getEnd());

        auditLogService.log("TECHNICIAN", null, AuditAction.UPDATE, AuditEntityType.MAINTENANCE, machine.getCode(),
                "Karbantartás frissítve: " + maintenance.getTitle() + " (Státusz: " + request.getStatus() + ")");

        return maintenanceMapper.convertToResponse(machineMaintenanceRepository.save(maintenance));
    }

    public MachineMaintenanceResponse updateMaintenanceStatus(UUID id, MachineMaintenanceStatusUpdateRequest request) {
        MachineMaintenance maintenance = getMaintenanceEntityById(id);
        Machine machine = maintenance.getMachine();

        if (request.getTechnicianId() != null) {
            User technician = userRepository.findById(request.getTechnicianId())
                    .orElseThrow(() -> new EntityNotFoundException("Technikus nem található!"));
            maintenance.setTechnician(technician);
        }

        if (request.getStatus() == MaintenanceStatus.IN_PROGRESS && maintenance.getTechnician() == null) {
            throw new IllegalStateException(
                    "A karbantartási folyamat nem indítható el felelős technikus hozzárendelése nélkül!");
        }

        if (request.getStatus() == MaintenanceStatus.IN_PROGRESS) {
            machine.setStatus(MachineStatus.MAINTENANCE);
            machineRepository.save(machine);
        }

        if (request.getStatus() == MaintenanceStatus.COMPLETED
                || request.getStatus() == MaintenanceStatus.CANCELLED) {
            machine.setStatus(MachineStatus.IDLE);
            machineRepository.save(machine);
        }

        maintenance.setStatus(request.getStatus());
        maintenance.setRootCause(request.getRootCause());
        maintenance.setActionTaken(request.getActionTaken());
        maintenance.setDowntimeMinutes(request.getDowntimeMinutes());
        maintenance.setCost(request.getCost());

        MachineMaintenance saved = machineMaintenanceRepository.save(maintenance);
        auditLogService.log(AuditAction.STATUS_CHANGE, AuditEntityType.MAINTENANCE, machine.getCode(),
                "Karbantartás státusza módosítva: " + maintenance.getTitle() + " -> " + request.getStatus());

        return maintenanceMapper.convertToResponse(saved);
    }

    public void deleteMaintenance(UUID id) {
        MachineMaintenance maintenance = getMaintenanceEntityById(id);
        machineMaintenanceRepository.delete(maintenance);

        auditLogService.log(AuditAction.DELETE, AuditEntityType.MAINTENANCE, maintenance.getMachine().getCode(),
                "Karbantartás törölve: " + maintenance.getTitle());
    }

    private MachineMaintenance getMaintenanceEntityById(UUID id) {
        return machineMaintenanceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("A karbantartási jegy nem található!"));
    }
}
