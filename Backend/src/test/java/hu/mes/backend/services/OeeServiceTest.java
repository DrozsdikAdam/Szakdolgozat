/*
================================================================
Ez a fájl mesterséges intelligencia segítségével íródott. 
================================================================
*/
package hu.mes.backend.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import hu.mes.backend.dtos.telemetry.OeeAggregationProjection;
import hu.mes.backend.dtos.telemetry.OeeResponse;
import hu.mes.backend.models.Machine;
import hu.mes.backend.repositories.MachineRepository;
import hu.mes.backend.repositories.MachineTelemetryRepository;

@ExtendWith(MockitoExtension.class)
public class OeeServiceTest {

    @InjectMocks
    private OeeService oeeService;

    @Mock
    private MachineRepository machineRepository;

    @Mock
    private MachineTelemetryRepository telemetryRepository;

    private UUID machineId;
    private Machine machine;
    private LocalDateTime start;
    private LocalDateTime end;

    @BeforeEach
    void setUp() {
        machineId = UUID.randomUUID();
        machine = Machine.builder()
                .code("M-01")
                .name("Gép 1")
                .idealCycleTimeSeconds(10.0) // 10 mp / darab -> 5 mp alatt 0.5 darab
                .build();
        machine.setId(machineId);

        start = LocalDateTime.now().minusHours(1);
        end = LocalDateTime.now();
    }

    @Test
    void calculateMachineOee_EmptyTelemetry_ReturnsZeroOee() {
        when(machineRepository.findById(machineId)).thenReturn(Optional.of(machine));
        when(telemetryRepository.calculateOeeAggregation(machineId, start, end))
                .thenReturn(null);

        OeeResponse response = oeeService.calculateMachineOee(machineId, start, end);

        assertNotNull(response);
        assertEquals(0.0, response.getAvailabilityPercentage());
        assertEquals(0.0, response.getPerformancePercentage());
        assertEquals(0.0, response.getQualityPercentage());
        assertEquals(0.0, response.getOeePercentage());
        assertEquals(0, response.getTotalProducedCount());
        assertEquals(0, response.getTotalScrapCount());
    }

    @Test
    void calculateMachineOee_MachineNotFound_ThrowsRuntimeException() {
        when(machineRepository.findById(machineId)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> oeeService.calculateMachineOee(machineId, start, end));
    }

    @Test
    void calculateMachineOee_NormalOperation_CalculatesAccurately() {
        // 2 minta: 1 RUNNING (produced=10, scrap=2), 1 IDLE (produced=0, scrap=0)
        // totalSamples = 2, runningSamples = 1 -> availability = 50%
        // totalProduced = 10, totalScrap = 2, good = 8 -> quality = 80%
        // potential = (1 * 5) / 10 = 0.5 -> performance = (10 / 0.5) * 100 = 2000% ->
        // levágva 100%-ra
        // oee = (0.5 * 1.0 * 0.8) * 100 = 40%

        OeeAggregationProjection agg = mock(OeeAggregationProjection.class);
        when(agg.getTotalSamples()).thenReturn(2L);
        when(agg.getRunningSamples()).thenReturn(1L);
        when(agg.getTotalProduced()).thenReturn(10L);
        when(agg.getTotalScrap()).thenReturn(2L);

        when(machineRepository.findById(machineId)).thenReturn(Optional.of(machine));
        when(telemetryRepository.calculateOeeAggregation(machineId, start, end))
                .thenReturn(agg);

        OeeResponse response = oeeService.calculateMachineOee(machineId, start, end);

        assertNotNull(response);
        assertEquals(50.0, response.getAvailabilityPercentage());
        assertEquals(80.0, response.getQualityPercentage());
        assertEquals(100.0, response.getPerformancePercentage()); // levágva 100-ra
        assertEquals(40.0, response.getOeePercentage());
        assertEquals(10, response.getTotalProducedCount());
        assertEquals(2, response.getTotalScrapCount());
    }

    @Test
    void calculateOeeFallback_ReturnsZeroOee() {
        Throwable t = new RuntimeException("Adatbázis hiba");
        OeeResponse response = oeeService.calculateOeeFallback(machineId, start, end, t);

        assertNotNull(response);
        assertEquals(0.0, response.getAvailabilityPercentage());
        assertEquals(0.0, response.getPerformancePercentage());
        assertEquals(0.0, response.getQualityPercentage());
        assertEquals(0.0, response.getOeePercentage());
    }
}
