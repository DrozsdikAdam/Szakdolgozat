/*
================================================================
Ez a fájl mesterséges intelligencia segítségével íródott. 
================================================================
*/
package hu.mes.backend.services;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import hu.mes.backend.models.Machine;
import hu.mes.backend.models.MachineTelemetry;
import hu.mes.backend.models.Product;
import hu.mes.backend.models.User;
import hu.mes.backend.models.WorkOrder;
import hu.mes.backend.models.enums.AuditAction;
import hu.mes.backend.models.enums.AuditEntityType;
import hu.mes.backend.models.enums.MachineStatus;
import hu.mes.backend.models.enums.NotificationType;
import hu.mes.backend.models.enums.WorkOrderStatus;
import hu.mes.backend.repositories.MachineRepository;
import hu.mes.backend.repositories.MachineTelemetryRepository;
import hu.mes.backend.repositories.WorkOrderRepository;

@ExtendWith(MockitoExtension.class)
public class PlcSimulatorServiceTest {

    @InjectMocks
    private PlcSimulatorService plcSimulatorService;

    @Mock
    private MachineRepository machineRepository;

    @Mock
    private MachineTelemetryRepository telemetryRepository;

    @Mock
    private WorkOrderRepository workOrderRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private AuditLogService auditLogService;

    private Machine machine;
    private User operator;
    private WorkOrder workOrder;
    private Product product;

    @BeforeEach
    void setUp() {
        operator = new User();
        operator.setId(UUID.randomUUID());
        operator.setName("Operátor 1");

        machine = Machine.builder()
                .code("CNC-01")
                .name("CNC Gép")
                .status(MachineStatus.RUNNING)
                .assignedUser(operator)
                .active(true)
                .build();
        machine.setId(UUID.randomUUID());

        product = Product.builder()
                .name("Késztermék")
                .sku("KT-01")
                .build();

        workOrder = WorkOrder.builder()
                .orderNumber("WO-2026-0001")
                .product(product)
                .status(WorkOrderStatus.IN_PROGRESS)
                .targetQuantity(BigDecimal.valueOf(100))
                .producedQuantity(BigDecimal.valueOf(50))
                .scrapQuantity(BigDecimal.valueOf(2))
                .assignedUser(operator)
                .build();
    }

    @Test
    void generateTelemetryData_NoMachines_DoesNothing() {
        when(machineRepository.findByActiveTrue()).thenReturn(Collections.emptyList());

        plcSimulatorService.generateTelemetryData();

        verify(telemetryRepository, never()).save(any());
    }

    @Test
    void generateTelemetryData_MachineRunning_NoActiveWorkOrder_SetsMachineIdle() {
        when(machineRepository.findByActiveTrue()).thenReturn(List.of(machine));
        when(workOrderRepository.findByAssignedUser(operator)).thenReturn(Collections.emptyList());

        plcSimulatorService.generateTelemetryData();

        assertEquals(MachineStatus.IDLE, machine.getStatus());
        verify(machineRepository).save(machine);
        verify(notificationService).send(any(), any(), eq(NotificationType.WARNING), eq("/machine"));
        verify(auditLogService).log(eq("SYSTEM"), any(), eq(AuditAction.STATUS_CHANGE), eq(AuditEntityType.MACHINE),
                eq("CNC-01"), any());
        verify(telemetryRepository).save(any(MachineTelemetry.class));
    }

    @Test
    void generateTelemetryData_MachineRunning_WithActiveWorkOrder_SavesTelemetry() {
        when(machineRepository.findByActiveTrue()).thenReturn(List.of(machine));
        when(workOrderRepository.findByAssignedUser(operator)).thenReturn(List.of(workOrder));

        plcSimulatorService.generateTelemetryData();

        verify(workOrderRepository).save(workOrder);
        verify(telemetryRepository).save(any(MachineTelemetry.class));
    }

    @Test
    void generateTelemetryData_MachineRunning_ReachesTargetQuantity_SetsQualityCheck() {
        // Célszám: 100, előállított jó darab: 100
        workOrder.setTargetQuantity(BigDecimal.valueOf(100));
        workOrder.setProducedQuantity(BigDecimal.valueOf(102));
        workOrder.setScrapQuantity(BigDecimal.valueOf(2)); // jó darab = 100

        when(machineRepository.findByActiveTrue()).thenReturn(List.of(machine));
        when(workOrderRepository.findByAssignedUser(operator)).thenReturn(List.of(workOrder));

        plcSimulatorService.generateTelemetryData();

        assertEquals(MachineStatus.IDLE, machine.getStatus());
        assertEquals(WorkOrderStatus.QUALITY_CHECK, workOrder.getStatus());
        verify(machineRepository).save(machine);
        verify(workOrderRepository).save(workOrder);
        verify(notificationService).send(any(), any(), eq(NotificationType.SUCCESS), eq("/workorder"));
        verify(auditLogService).log(eq(AuditAction.STATUS_CHANGE), eq(AuditEntityType.WORKORDER), eq("WO-2026-0001"),
                any());
    }

    @Test
    void generateTelemetryFallback_DoesNotThrow() {
        assertDoesNotThrow(
                () -> plcSimulatorService.generateTelemetryFallback(new RuntimeException("Szimulációs hiba")));
    }
}
