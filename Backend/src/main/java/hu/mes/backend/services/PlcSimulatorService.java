package hu.mes.backend.services;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import hu.mes.backend.models.Machine;
import hu.mes.backend.models.MachineTelemetry;
import hu.mes.backend.models.WorkOrder;
import hu.mes.backend.models.enums.MachineStatus;
import hu.mes.backend.models.enums.WorkOrderStatus;
import hu.mes.backend.repositories.MachineRepository;
import hu.mes.backend.repositories.MachineTelemetryRepository;
import hu.mes.backend.repositories.WorkOrderRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class PlcSimulatorService {

    private final MachineRepository machineRepository;
    private final MachineTelemetryRepository telemetryRepository;
    private final WorkOrderRepository workOrderRepository;

    @Scheduled(fixedRate = 5000)
    public void generateTelemetryData() {

        List<Machine> machines = machineRepository.findByActiveTrue();

        for (Machine machine : machines) {
            WorkOrder activeWorkOrder = null;
            if (machine.getAssignedUser() != null) {
                activeWorkOrder = workOrderRepository.findByAssignedUser(machine.getAssignedUser())
                        .stream()
                        .filter(wo -> wo.getStatus() == WorkOrderStatus.IN_PROGRESS)
                        .findFirst()
                        .orElse(null);
            }

            int produced = generateRandomProducedQuantity(machine.getStatus());
            int scrap = generateRandomScrapQuantity(machine.getStatus());

            if (activeWorkOrder != null && produced > 0) {

                BigDecimal currentProduced = activeWorkOrder.getProducedQuantity() != null
                        ? activeWorkOrder.getProducedQuantity()
                        : BigDecimal.ZERO;
                activeWorkOrder.setProducedQuantity(currentProduced.add(BigDecimal.valueOf(produced)));

                if (scrap > 0) {
                    BigDecimal currentScrap = activeWorkOrder.getScrapQuantity() != null
                            ? activeWorkOrder.getScrapQuantity()
                            : BigDecimal.ZERO;
                    activeWorkOrder.setScrapQuantity(currentScrap.add(BigDecimal.valueOf(scrap)));
                }

                BigDecimal goodProduced = activeWorkOrder.getProducedQuantity()
                        .subtract(activeWorkOrder.getScrapQuantity() != null ? activeWorkOrder.getScrapQuantity()
                                : BigDecimal.ZERO);

                if (activeWorkOrder.getTargetQuantity() != null
                        && goodProduced.compareTo(activeWorkOrder.getTargetQuantity()) >= 0) {
                    machine.setStatus(MachineStatus.IDLE);
                    machineRepository.save(machine);
                }

                workOrderRepository.save(activeWorkOrder);
            }

            telemetryRepository.save(
                    MachineTelemetry.builder()
                            .machine(machine)
                            .temperature(generateRandomTemperature(machine.getStatus()))
                            .scrapCount(scrap)
                            .producedCount(produced)
                            .vibration(generateRandomVibration(machine.getStatus()))
                            .pressureBar(generateRandomPressure(machine.getStatus()))
                            .activeWorkOrder(activeWorkOrder)
                            .powerKw(generateRandomPowerConsumption(machine.getStatus()))
                            .timestamp(LocalDateTime.now())
                            .status(machine.getStatus())
                            .build());
        }

    }

    private Double generateRandomPowerConsumption(MachineStatus status) {
        double power = 0.0;
        switch (status) {
            case RUNNING:
                power = Math.random() * 10.0 + 12.0;
                break;
            case IDLE:
                power = Math.random() * 2.0 + 4.0;
                break;
            default:
                power = 0.0;
                break;
        }
        return power;
    }

    private Double generateRandomPressure(MachineStatus status) {
        double pressure = 0.0;
        if (status == MachineStatus.OFFLINE)
            return pressure;

        pressure = Math.random() * 1.4 + 5.8;
        return pressure;
    }

    private Double generateRandomVibration(MachineStatus status) {
        double vibration = 0.0;
        switch (status) {
            case RUNNING:
                vibration = Math.random() * 2.3 + 1.2;
                break;
            case ERROR:
                vibration = Math.random() * 5.3 + 3.2;
                break;
            case IDLE:
                vibration = Math.random() * 1.3 + 0.2;
                break;
            default:
                vibration = 0.0;
                break;
        }
        return vibration;
    }

    private double generateRandomTemperature(MachineStatus status) {
        double temp = 20.0;
        switch (status) {
            case RUNNING:
                temp = Math.random() * 20 + 45;
                break;
            case ERROR:
                temp = Math.random() * 30 + 70;
                break;
            case MAINTENANCE:
                temp = Math.random() * 15 + 30;
                break;
            default:
                temp = Math.random() * 10 + 25;
                break;
        }
        return temp;
    }

    private Integer generateRandomProducedQuantity(MachineStatus status) {
        Integer produced = 0;
        switch (status) {
            case RUNNING:
                produced = Math.random() < 0.85 ? 1 : 0;
                break;
            default:
                produced = 0;
                break;
        }
        return produced;
    }

    private Integer generateRandomScrapQuantity(MachineStatus status) {
        Integer scrap = 0;
        switch (status) {
            case RUNNING:
                scrap = Math.random() * 100 < 10 ? 1 : 0;
                break;
            default:
                scrap = 0;
                break;
        }
        return scrap;
    }

}
