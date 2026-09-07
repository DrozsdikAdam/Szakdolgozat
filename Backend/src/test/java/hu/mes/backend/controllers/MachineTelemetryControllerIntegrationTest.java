/*
================================================================
Ez a fájl mesterséges intelligencia segítségével íródott. 
================================================================
*/
package hu.mes.backend.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import hu.mes.backend.dtos.telemetry.MachineTelemetryResponse;
import hu.mes.backend.dtos.telemetry.OeeResponse;
import hu.mes.backend.exceptions.GlobalExceptionHandler;
import hu.mes.backend.mappers.TelemetryMapper;
import hu.mes.backend.models.MachineTelemetry;
import hu.mes.backend.models.enums.MachineStatus;
import hu.mes.backend.repositories.MachineTelemetryRepository;
import hu.mes.backend.security.CustomUserDetailsService;
import hu.mes.backend.security.JwtAuthenticationFilter;
import hu.mes.backend.security.JwtUtils;
import hu.mes.backend.services.AuditLogService;
import hu.mes.backend.services.OeeService;

@WebMvcTest(controllers = MachineTelemetryController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
public class MachineTelemetryControllerIntegrationTest {

        @Autowired
        private MockMvc mockMvc;

        @MockitoBean
        private MachineTelemetryRepository telemetryRepository;

        @MockitoBean
        private OeeService oeeService;

        @MockitoBean
        private AuditLogService auditLogService;

        @MockitoBean
        private CacheManager cacheManager;

        @MockitoBean
        private TelemetryMapper telemetryMapper;

        @MockitoBean
        private JwtAuthenticationFilter jwtAuthenticationFilter;

        @MockitoBean
        private JwtUtils jwtUtils;

        @MockitoBean
        private CustomUserDetailsService customUserDetailsService;

        private UUID machineId;
        private MachineTelemetry telemetry;
        private MachineTelemetryResponse telemetryResponse;

        @BeforeEach
        void setUp() {
                machineId = UUID.randomUUID();

                telemetry = MachineTelemetry.builder()
                                .status(MachineStatus.RUNNING)
                                .producedCount(10)
                                .scrapCount(1)
                                .build();

                telemetryResponse = new MachineTelemetryResponse();
                telemetryResponse.setStatus(MachineStatus.RUNNING);
                telemetryResponse.setProducedCount(10);
                telemetryResponse.setScrapCount(1);
        }

        @Test
        void getLatestTelemetry_Success() throws Exception {
                when(telemetryRepository.findTopByMachineIdOrderByTimestampDesc(machineId))
                                .thenReturn(Optional.of(telemetry));
                when(telemetryMapper.convertToResponse(telemetry)).thenReturn(telemetryResponse);

                mockMvc.perform(get("/api/telemetry/machine/{machineId}/latest", machineId))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.status").value("RUNNING"))
                                .andExpect(jsonPath("$.producedCount").value(10));
        }

        @Test
        void getLatestTelemetry_NotFound_Returns404() throws Exception {
                when(telemetryRepository.findTopByMachineIdOrderByTimestampDesc(machineId))
                                .thenReturn(Optional.empty());

                mockMvc.perform(get("/api/telemetry/machine/{machineId}/latest", machineId))
                                .andExpect(status().isNotFound());
        }

        @Test
        void getMachineOee_Success() throws Exception {
                OeeResponse oeeResponse = OeeResponse.builder()
                                .availabilityPercentage(90.0)
                                .performancePercentage(95.0)
                                .qualityPercentage(99.0)
                                .oeePercentage(84.6)
                                .build();

                when(oeeService.calculateMachineOee(eq(machineId), any(LocalDateTime.class), any(LocalDateTime.class)))
                                .thenReturn(oeeResponse);

                mockMvc.perform(get("/api/telemetry/machine/{machineId}/oee", machineId))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.availabilityPercentage").value(90.0))
                                .andExpect(jsonPath("$.oeePercentage").value(84.6));
        }
}
