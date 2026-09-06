/*
================================================================
Ez a fájl mesterséges intelligencia segítségével íródott. 
================================================================
*/
package hu.mes.backend.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
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
import hu.mes.backend.dtos.machine.EmergencyStopRequest;
import hu.mes.backend.dtos.machine.MachineCreateRequest;
import hu.mes.backend.dtos.machine.MachineResponse;
import hu.mes.backend.dtos.machine.MachineUpdateRequest;
import hu.mes.backend.dtos.maintenance.MachineMaintenanceCreateRequest;
import hu.mes.backend.mappers.MachineMapper;
import hu.mes.backend.models.Machine;
import hu.mes.backend.models.User;
import hu.mes.backend.models.enums.AuditAction;
import hu.mes.backend.models.enums.AuditEntityType;
import hu.mes.backend.models.enums.MachineStatus;
import hu.mes.backend.models.enums.MachineType;
import hu.mes.backend.models.enums.NotificationType;
import hu.mes.backend.repositories.MachineRepository;
import hu.mes.backend.repositories.UserRepository;
import jakarta.persistence.EntityNotFoundException;

@ExtendWith(MockitoExtension.class)
public class MachineServiceTest {

    @InjectMocks
    private MachineService machineService;

    @Mock
    private MachineMaintenanceService machineMaintenanceService;

    @Mock
    private MachineRepository machineRepository;

    @Mock
    private MachineMapper machineMapper;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private AuditLogService auditLogService;

    private Machine machine;
    private User user;
    private UUID machineId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        machineId = UUID.randomUUID();
        userId = UUID.randomUUID();

        user = new User();
        user.setId(userId);
        user.setName("Teszt Technikus");

        machine = Machine.builder()
                .code("CNC-01")
                .name("CNC Marógép 1")
                .type(MachineType.CNC)
                .status(MachineStatus.IDLE)
                .manufacturer("Haas")
                .model("VF-2")
                .serialNumber("SN-12345")
                .idealCycleTimeSeconds(60.0)
                .targetPcsPerHour(50)
                .active(true)
                .build();
        machine.setId(machineId);
    }

    @Test
    void getAllMachines_ReturnsPagedResponse() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Machine> page = new PageImpl<>(List.of(machine));
        when(machineRepository.findByActiveTrue(pageable)).thenReturn(page);
        when(machineMapper.convertToResponses(List.of(machine))).thenReturn(List.of(new MachineResponse()));

        PagedResponse<MachineResponse> result = machineService.getAllMachines(pageable);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
    }

    @Test
    void getMachineById_Success() {
        when(machineRepository.findById(machineId)).thenReturn(Optional.of(machine));
        MachineResponse response = new MachineResponse();
        when(machineMapper.convertToResponse(machine)).thenReturn(response);

        MachineResponse result = machineService.getMachineById(machineId);

        assertNotNull(result);
        verify(machineRepository).findById(machineId);
    }

    @Test
    void getMachineById_NotFound_ThrowsEntityNotFoundException() {
        when(machineRepository.findById(machineId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> machineService.getMachineById(machineId));
    }

    @Test
    void getMachinesByStatus_Success() {
        when(machineRepository.findByStatus(MachineStatus.IDLE)).thenReturn(List.of(machine));
        when(machineMapper.convertToResponses(List.of(machine))).thenReturn(List.of(new MachineResponse()));

        List<MachineResponse> list = machineService.getMachinesByStatus(MachineStatus.IDLE);

        assertNotNull(list);
        assertEquals(1, list.size());
    }

    @Test
    void getMachinesByType_Success() {
        when(machineRepository.findByType(MachineType.CNC)).thenReturn(List.of(machine));
        when(machineMapper.convertToResponses(List.of(machine))).thenReturn(List.of(new MachineResponse()));

        List<MachineResponse> list = machineService.getMachinesByType(MachineType.CNC);

        assertNotNull(list);
        assertEquals(1, list.size());
    }

    @Test
    void getMachinesByUserId_Success() {
        when(machineRepository.findByAssignedUserId(userId)).thenReturn(List.of(machine));
        when(machineMapper.convertToResponses(List.of(machine))).thenReturn(List.of(new MachineResponse()));

        List<MachineResponse> list = machineService.getMachinesByUserId(userId);

        assertNotNull(list);
        assertEquals(1, list.size());
    }

    @Test
    void getMachinesByTypeAndStatus_Success() {
        when(machineRepository.findByTypeAndStatus(MachineType.CNC, MachineStatus.IDLE))
                .thenReturn(List.of(machine));
        when(machineMapper.convertToResponses(List.of(machine))).thenReturn(List.of(new MachineResponse()));

        List<MachineResponse> list = machineService.getMachinesByTypeAndStatus(MachineType.CNC,
                MachineStatus.IDLE);

        assertNotNull(list);
        assertEquals(1, list.size());
    }

    @Test
    void createMachine_Success_WithoutUser() {
        MachineCreateRequest request = new MachineCreateRequest();
        request.setCode("CNC-02");
        request.setName("CNC Eszterga");
        request.setType(MachineType.LASER_CUTTER);
        request.setStatus(MachineStatus.IDLE);
        request.setIdealCycleTimeSeconds(45.0);
        request.setTargetPcsPerHour(70);

        when(machineRepository.existsByCode("CNC-02")).thenReturn(false);
        when(machineRepository.save(any(Machine.class))).thenAnswer(i -> i.getArgument(0));
        when(machineMapper.convertToResponse(any())).thenReturn(new MachineResponse());

        MachineResponse response = machineService.createMachine(request);

        assertNotNull(response);
        verify(machineRepository).save(any(Machine.class));
        verify(auditLogService).log(eq("USER"), any(), eq(AuditAction.CREATE), eq(AuditEntityType.MACHINE),
                eq("CNC-02"), any());
    }

    @Test
    void createMachine_Success_WithUser() {
        MachineCreateRequest request = new MachineCreateRequest();
        request.setCode("CNC-03");
        request.setName("CNC Gép 3");
        request.setAssignedUserId(userId);

        when(machineRepository.existsByCode("CNC-03")).thenReturn(false);
        when(userRepository.existsById(userId)).thenReturn(true);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(machineRepository.save(any(Machine.class))).thenAnswer(i -> i.getArgument(0));
        when(machineMapper.convertToResponse(any())).thenReturn(new MachineResponse());

        MachineResponse response = machineService.createMachine(request);

        assertNotNull(response);
        verify(machineRepository).save(any(Machine.class));
    }

    @Test
    void createMachine_NullRequest_ThrowsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class, () -> machineService.createMachine(null));
    }

    @Test
    void createMachine_DuplicateCode_ThrowsIllegalArgumentException() {
        MachineCreateRequest request = new MachineCreateRequest();
        request.setCode("CNC-01");

        when(machineRepository.existsByCode("CNC-01")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> machineService.createMachine(request));
        verify(machineRepository, never()).save(any());
    }

    @Test
    void createMachine_UserNotFound_ThrowsEntityNotFoundException() {
        MachineCreateRequest request = new MachineCreateRequest();
        request.setCode("CNC-04");
        request.setAssignedUserId(userId);

        when(machineRepository.existsByCode("CNC-04")).thenReturn(false);
        when(userRepository.existsById(userId)).thenReturn(true);
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> machineService.createMachine(request));
    }

    @Test
    void updateMachine_Success() {
        MachineUpdateRequest request = new MachineUpdateRequest();
        request.setCode("CNC-01-MOD");
        request.setName("Módosított CNC");
        request.setType(MachineType.CNC);
        request.setStatus(MachineStatus.RUNNING);

        when(machineRepository.findById(machineId)).thenReturn(Optional.of(machine));
        when(machineRepository.existsByCode("CNC-01-MOD")).thenReturn(false);
        when(machineRepository.save(any(Machine.class))).thenAnswer(i -> i.getArgument(0));
        when(machineMapper.convertToResponse(any())).thenReturn(new MachineResponse());

        MachineResponse response = machineService.updateMachine(machineId, request);

        assertNotNull(response);
        assertEquals("CNC-01-MOD", machine.getCode());
        assertEquals("Módosított CNC", machine.getName());
        verify(auditLogService).log(eq("USER"), any(), eq(AuditAction.UPDATE), eq(AuditEntityType.MACHINE),
                eq("CNC-01-MOD"), any());
    }

    @Test
    void updateMachine_DuplicateCode_ThrowsIllegalArgumentException() {
        MachineUpdateRequest request = new MachineUpdateRequest();
        request.setCode("CNC-OTHER");

        when(machineRepository.findById(machineId)).thenReturn(Optional.of(machine));
        when(machineRepository.existsByCode("CNC-OTHER")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> machineService.updateMachine(machineId, request));
        verify(machineRepository, never()).save(any());
    }

    @Test
    void updateMachine_UserNotFound_ThrowsIllegalArgumentException() {
        MachineUpdateRequest request = new MachineUpdateRequest();
        request.setCode("CNC-01");
        request.setAssignedUserId(userId);

        when(machineRepository.findById(machineId)).thenReturn(Optional.of(machine));
        when(userRepository.existsById(userId)).thenReturn(false);

        assertThrows(IllegalArgumentException.class, () -> machineService.updateMachine(machineId, request));
    }

    @Test
    void updateMachineStatus_Success() {
        when(machineRepository.findById(machineId)).thenReturn(Optional.of(machine));
        when(machineRepository.save(any(Machine.class))).thenAnswer(i -> i.getArgument(0));
        when(machineMapper.convertToResponse(any())).thenReturn(new MachineResponse());

        machineService.updateMachineStatus(machineId, MachineStatus.MAINTENANCE);

        assertEquals(MachineStatus.MAINTENANCE, machine.getStatus());
        verify(auditLogService).log(eq("USER"), any(), eq(AuditAction.STATUS_CHANGE), eq(AuditEntityType.MACHINE),
                eq("CNC-01"), any());
    }

    @Test
    void updateMachineUser_Success() {
        when(machineRepository.findById(machineId)).thenReturn(Optional.of(machine));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(machineRepository.save(any(Machine.class))).thenAnswer(i -> i.getArgument(0));
        when(machineMapper.convertToResponse(any())).thenReturn(new MachineResponse());

        machineService.updateMachineUser(machineId, userId);

        assertEquals(user, machine.getAssignedUser());
        verify(machineRepository).save(machine);
    }

    @Test
    void updateMachineUser_UserNotFound_ThrowsEntityNotFoundException() {
        when(machineRepository.findById(machineId)).thenReturn(Optional.of(machine));
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> machineService.updateMachineUser(machineId, userId));
    }

    @Test
    void deleteMachine_SetsActiveFalseAndDeletedAt() {
        when(machineRepository.findById(machineId)).thenReturn(Optional.of(machine));

        machineService.deleteMachine(machineId);

        assertFalse(machine.getActive());
        assertNotNull(machine.getDeletedAt());
        verify(machineRepository).save(machine);
    }

    @Test
    void restoreMachine_Success() {
        machine.setDeletedAt(LocalDateTime.now());
        machine.setActive(false);
        when(machineRepository.findByIdAndDeletedAtNotNull(machineId)).thenReturn(Optional.of(machine));

        machineService.restoreMachine(machineId);

        assertTrue(machine.getActive());
        assertNull(machine.getDeletedAt());
        verify(machineRepository).save(machine);
    }

    @Test
    void restoreMachine_NotFound_ThrowsEntityNotFoundException() {
        when(machineRepository.findByIdAndDeletedAtNotNull(machineId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> machineService.restoreMachine(machineId));
    }

    @Test
    void updateMachineActiveStatus_Success() {
        when(machineRepository.findById(machineId)).thenReturn(Optional.of(machine));

        machineService.updateMachineActiveStatus(machineId, false);

        assertFalse(machine.getActive());
        verify(machineRepository).save(machine);
    }

    @Test
    void getDeletedMachines_Success() {
        when(machineRepository.findByDeletedAtNotNull()).thenReturn(List.of(machine));
        when(machineMapper.convertToResponses(List.of(machine))).thenReturn(List.of(new MachineResponse()));

        List<MachineResponse> list = machineService.getDeletedMachines();

        assertNotNull(list);
        assertEquals(1, list.size());
    }

    @Test
    void getInactiveMachines_Success() {
        when(machineRepository.findByActiveFalse()).thenReturn(List.of(machine));
        when(machineMapper.convertToResponses(List.of(machine))).thenReturn(List.of(new MachineResponse()));

        List<MachineResponse> list = machineService.getInactiveMachines();

        assertNotNull(list);
        assertEquals(1, list.size());
    }

    @Test
    void emergencyStop_SetsStatusErrorAndCreatesMaintenanceAndNotification() {
        EmergencyStopRequest request = new EmergencyStopRequest();
        request.setReason("Túlmelegedés");
        request.setDescription("A motor füstölni kezdett");
        request.setTechnicianId(userId);

        when(machineRepository.findById(machineId)).thenReturn(Optional.of(machine));
        when(machineRepository.save(any(Machine.class))).thenAnswer(i -> i.getArgument(0));
        when(machineMapper.convertToResponse(any())).thenReturn(new MachineResponse());

        MachineResponse response = machineService.emergencyStop(machineId, request);

        assertNotNull(response);
        assertEquals(MachineStatus.ERROR, machine.getStatus());
        verify(notificationService).send(any(), any(), eq(NotificationType.ERROR), eq("/machine"));
        verify(auditLogService).log(eq("OPERATOR"), any(), eq(AuditAction.EMERGENCY_STOP), eq(AuditEntityType.MACHINE),
                eq("CNC-01"), any());
        verify(machineMaintenanceService).createMaintenance(any(MachineMaintenanceCreateRequest.class));
    }
}
