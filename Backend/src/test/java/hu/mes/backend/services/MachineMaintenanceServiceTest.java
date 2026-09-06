/*
================================================================
Ez a fájl mesterséges intelligencia segítségével íródott. 
================================================================
*/
package hu.mes.backend.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

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
import hu.mes.backend.models.enums.MaintenanceType;
import hu.mes.backend.models.enums.NotificationType;
import hu.mes.backend.repositories.MachineMaintenanceRepository;
import hu.mes.backend.repositories.MachineRepository;
import hu.mes.backend.repositories.UserRepository;
import jakarta.persistence.EntityNotFoundException;

@ExtendWith(MockitoExtension.class)
public class MachineMaintenanceServiceTest {

    @InjectMocks
    private MachineMaintenanceService machineMaintenanceService;

    @Mock
    private MachineMaintenanceRepository machineMaintenanceRepository;

    @Mock
    private MachineRepository machineRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MaintenanceMapper maintenanceMapper;

    @Mock
    private NotificationService notificationService;

    @Mock
    private AuditLogService auditLogService;

    private Machine machine;
    private User technician;
    private MachineMaintenance maintenance;
    private UUID maintenanceId;
    private UUID machineId;
    private UUID technicianId;

    @BeforeEach
    void setUp() {
        maintenanceId = UUID.randomUUID();
        machineId = UUID.randomUUID();
        technicianId = UUID.randomUUID();

        machine = Machine.builder()
                .code("M-01")
                .name("Gép 1")
                .status(MachineStatus.IDLE)
                .build();
        machine.setId(machineId);

        technician = new User();
        technician.setId(technicianId);
        technician.setName("Technikus Béla");

        maintenance = MachineMaintenance.builder()
                .machine(machine)
                .technician(technician)
                .title("Időszakos olajcsere")
                .status(MaintenanceStatus.SCHEDULED)
                .type(MaintenanceType.PREVENTIVE)
                .start(LocalDateTime.now())
                .build();
        maintenance.setId(maintenanceId);
    }

    @Test
    void getAllMaintenances_Paged_ReturnsPagedResponse() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<MachineMaintenance> page = new PageImpl<>(List.of(maintenance));
        when(machineMaintenanceRepository.findAll(pageable)).thenReturn(page);
        when(maintenanceMapper.convertToResponses(List.of(maintenance)))
                .thenReturn(List.of(new MachineMaintenanceResponse()));

        PagedResponse<MachineMaintenanceResponse> result = machineMaintenanceService.getAllMaintenances(pageable);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
    }

    @Test
    void getAllMaintenances_List_ReturnsList() {
        when(machineMaintenanceRepository.findAll()).thenReturn(List.of(maintenance));
        when(maintenanceMapper.convertToResponses(List.of(maintenance)))
                .thenReturn(List.of(new MachineMaintenanceResponse()));

        List<MachineMaintenanceResponse> result = machineMaintenanceService.getAllMaintenances();

        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    void getMaintenanceById_Success() {
        when(machineMaintenanceRepository.findById(maintenanceId)).thenReturn(Optional.of(maintenance));
        when(maintenanceMapper.convertToResponse(maintenance)).thenReturn(new MachineMaintenanceResponse());

        MachineMaintenanceResponse result = machineMaintenanceService.getMaintenanceById(maintenanceId);

        assertNotNull(result);
    }

    @Test
    void getMaintenanceById_NotFound_ThrowsEntityNotFoundException() {
        when(machineMaintenanceRepository.findById(maintenanceId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> machineMaintenanceService.getMaintenanceById(maintenanceId));
    }

    @Test
    void getMaintenanceByMachineId_Success() {
        when(machineMaintenanceRepository.findByMachineId(machineId)).thenReturn(List.of(maintenance));
        when(maintenanceMapper.convertToResponses(List.of(maintenance)))
                .thenReturn(List.of(new MachineMaintenanceResponse()));

        List<MachineMaintenanceResponse> result = machineMaintenanceService.getMaintenanceByMachineId(machineId);

        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    void getMaintenanceByTechnicianId_Success() {
        when(machineMaintenanceRepository.findByTechnicianId(technicianId)).thenReturn(List.of(maintenance));
        when(maintenanceMapper.convertToResponses(List.of(maintenance)))
                .thenReturn(List.of(new MachineMaintenanceResponse()));

        List<MachineMaintenanceResponse> result = machineMaintenanceService.getMaintenanceByTechnicianId(technicianId);

        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    void getMaintenancesByStatus_Success() {
        when(machineMaintenanceRepository.findByStatus(MaintenanceStatus.SCHEDULED)).thenReturn(List.of(maintenance));
        when(maintenanceMapper.convertToResponses(List.of(maintenance)))
                .thenReturn(List.of(new MachineMaintenanceResponse()));

        List<MachineMaintenanceResponse> result = machineMaintenanceService
                .getMaintenancesByStatus(MaintenanceStatus.SCHEDULED);

        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    void getMaintenancesByMachineIdAndStatus_Success() {
        when(machineMaintenanceRepository.findByMachineIdAndStatus(machineId, MaintenanceStatus.SCHEDULED))
                .thenReturn(List.of(maintenance));
        when(maintenanceMapper.convertToResponses(List.of(maintenance)))
                .thenReturn(List.of(new MachineMaintenanceResponse()));

        List<MachineMaintenanceResponse> result = machineMaintenanceService
                .getMaintenancesByMachineIdAndStatus(machineId, MaintenanceStatus.SCHEDULED);

        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    void createMaintenance_WhenInProgress_SetsMachineMaintenanceStatus() {
        MachineMaintenanceCreateRequest request = MachineMaintenanceCreateRequest.builder()
                .machineId(machineId)
                .technicianId(technicianId)
                .status(MaintenanceStatus.IN_PROGRESS)
                .type(MaintenanceType.CORRECTIVE)
                .title("Szíj csere")
                .build();

        when(machineRepository.findById(machineId)).thenReturn(Optional.of(machine));
        when(userRepository.findById(technicianId)).thenReturn(Optional.of(technician));
        when(machineMaintenanceRepository.save(any(MachineMaintenance.class))).thenAnswer(i -> i.getArgument(0));
        when(maintenanceMapper.convertToResponse(any())).thenReturn(new MachineMaintenanceResponse());

        MachineMaintenanceResponse response = machineMaintenanceService.createMaintenance(request);

        assertNotNull(response);
        assertEquals(MachineStatus.MAINTENANCE, machine.getStatus());
        verify(machineRepository).save(machine);
        verify(notificationService).send(any(), any(), eq(NotificationType.INFO), eq("/maintenance"));
        verify(auditLogService).log(eq("TECHNICIAN"), any(), eq(AuditAction.MAINTENANCE_LOG),
                eq(AuditEntityType.MAINTENANCE), eq("M-01"), any());
    }

    @Test
    void createMaintenance_WhenCompleted_SetsMachineIdle() {
        MachineMaintenanceCreateRequest request = MachineMaintenanceCreateRequest.builder()
                .machineId(machineId)
                .technicianId(technicianId)
                .status(MaintenanceStatus.COMPLETED)
                .type(MaintenanceType.PREVENTIVE)
                .title("Átvizsgálás kész")
                .build();

        when(machineRepository.findById(machineId)).thenReturn(Optional.of(machine));
        when(userRepository.findById(technicianId)).thenReturn(Optional.of(technician));
        when(machineMaintenanceRepository.save(any(MachineMaintenance.class))).thenAnswer(i -> i.getArgument(0));
        when(maintenanceMapper.convertToResponse(any())).thenReturn(new MachineMaintenanceResponse());

        machineMaintenanceService.createMaintenance(request);

        assertEquals(MachineStatus.IDLE, machine.getStatus());
        verify(machineRepository).save(machine);
    }

    @Test
    void createMaintenance_MachineNotFound_ThrowsEntityNotFoundException() {
        MachineMaintenanceCreateRequest request = MachineMaintenanceCreateRequest.builder()
                .machineId(machineId)
                .build();

        when(machineRepository.findById(machineId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> machineMaintenanceService.createMaintenance(request));
    }

    @Test
    void updateMaintenance_Success() {
        MachineMaintenanceUpdateRequest request = new MachineMaintenanceUpdateRequest();
        request.setTitle("Módosított karbantartás");
        request.setStatus(MaintenanceStatus.IN_PROGRESS);
        request.setType(MaintenanceType.CORRECTIVE);
        request.setTechnicianId(technicianId);

        when(machineMaintenanceRepository.findById(maintenanceId)).thenReturn(Optional.of(maintenance));
        when(userRepository.findById(technicianId)).thenReturn(Optional.of(technician));
        when(machineMaintenanceRepository.save(any(MachineMaintenance.class))).thenAnswer(i -> i.getArgument(0));
        when(maintenanceMapper.convertToResponse(any())).thenReturn(new MachineMaintenanceResponse());

        MachineMaintenanceResponse response = machineMaintenanceService.updateMaintenance(maintenanceId, request);

        assertNotNull(response);
        assertEquals(MachineStatus.MAINTENANCE, machine.getStatus());
        verify(auditLogService).log(eq("TECHNICIAN"), any(), eq(AuditAction.UPDATE), eq(AuditEntityType.MAINTENANCE),
                eq("M-01"), any());
    }

    @Test
    void updateMaintenanceStatus_InProgressWithoutTechnician_ThrowsIllegalStateException() {
        maintenance.setTechnician(null);
        MachineMaintenanceStatusUpdateRequest request = new MachineMaintenanceStatusUpdateRequest();
        request.setStatus(MaintenanceStatus.IN_PROGRESS);

        when(machineMaintenanceRepository.findById(maintenanceId)).thenReturn(Optional.of(maintenance));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> machineMaintenanceService.updateMaintenanceStatus(maintenanceId, request));
        assertEquals("A karbantartási folyamat nem indítható el felelős technikus hozzárendelése nélkül!",
                ex.getMessage());

        verify(machineMaintenanceRepository, never()).save(any());
    }

    @Test
    void updateMaintenanceStatus_ToCompleted_SetsMachineIdleAndSaves() {
        MachineMaintenanceStatusUpdateRequest request = new MachineMaintenanceStatusUpdateRequest();
        request.setStatus(MaintenanceStatus.COMPLETED);
        request.setRootCause("Kopott csapágy");
        request.setActionTaken("Csapágy kicserélve");

        when(machineMaintenanceRepository.findById(maintenanceId)).thenReturn(Optional.of(maintenance));
        when(machineMaintenanceRepository.save(any(MachineMaintenance.class))).thenAnswer(i -> i.getArgument(0));
        when(maintenanceMapper.convertToResponse(any())).thenReturn(new MachineMaintenanceResponse());

        machineMaintenanceService.updateMaintenanceStatus(maintenanceId, request);

        assertEquals(MaintenanceStatus.COMPLETED, maintenance.getStatus());
        assertEquals(MachineStatus.IDLE, machine.getStatus());
        verify(machineRepository).save(machine);
        verify(auditLogService).log(eq(AuditAction.STATUS_CHANGE), eq(AuditEntityType.MAINTENANCE), eq("M-01"), any());
    }

    @Test
    void deleteMaintenance_Success() {
        when(machineMaintenanceRepository.findById(maintenanceId)).thenReturn(Optional.of(maintenance));

        machineMaintenanceService.deleteMaintenance(maintenanceId);

        verify(machineMaintenanceRepository).delete(maintenance);
        verify(auditLogService).log(eq(AuditAction.DELETE), eq(AuditEntityType.MAINTENANCE), eq("M-01"), any());
    }
}
