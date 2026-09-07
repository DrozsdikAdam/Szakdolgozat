/*
================================================================
Ez a fájl mesterséges intelligencia segítségével íródott. 
================================================================
*/
package hu.mes.backend.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;

import hu.mes.backend.dtos.common.PagedResponse;
import hu.mes.backend.dtos.maintenance.MachineMaintenanceCreateRequest;
import hu.mes.backend.dtos.maintenance.MachineMaintenanceResponse;
import hu.mes.backend.dtos.maintenance.MachineMaintenanceStatusUpdateRequest;
import hu.mes.backend.exceptions.GlobalExceptionHandler;
import hu.mes.backend.models.enums.MaintenanceStatus;
import hu.mes.backend.models.enums.MaintenanceType;
import hu.mes.backend.security.CustomUserDetailsService;
import hu.mes.backend.security.JwtAuthenticationFilter;
import hu.mes.backend.security.JwtUtils;
import hu.mes.backend.services.AuditLogService;
import hu.mes.backend.services.MachineMaintenanceService;
import jakarta.persistence.EntityNotFoundException;

@WebMvcTest(controllers = MachineMaintenanceController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
public class MachineMaintenanceControllerIntegrationTest {

        @Autowired
        private MockMvc mockMvc;

        private ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

        @MockitoBean
        private MachineMaintenanceService machineMaintenanceService;

        @MockitoBean
        private AuditLogService auditLogService;

        @MockitoBean
        private CacheManager cacheManager;

        @MockitoBean
        private JwtAuthenticationFilter jwtAuthenticationFilter;

        @MockitoBean
        private JwtUtils jwtUtils;

        @MockitoBean
        private CustomUserDetailsService customUserDetailsService;

        private UUID maintenanceId;
        private UUID machineId;
        private MachineMaintenanceResponse maintenanceResponse;

        @BeforeEach
        void setUp() {
                maintenanceId = UUID.randomUUID();
                machineId = UUID.randomUUID();

                maintenanceResponse = new MachineMaintenanceResponse();
                maintenanceResponse.setId(maintenanceId);
                maintenanceResponse.setTitle("Olajcsere");
                maintenanceResponse.setStatus(MaintenanceStatus.SCHEDULED);
                maintenanceResponse.setType(MaintenanceType.PREVENTIVE);
        }

        @Test
        void getAllMaintenances_ReturnsPagedMaintenances() throws Exception {
                Page<MachineMaintenanceResponse> page = new PageImpl<>(List.of(maintenanceResponse));
                PagedResponse<MachineMaintenanceResponse> pagedResponse = PagedResponse.of(page,
                                List.of(maintenanceResponse));

                when(machineMaintenanceService.getAllMaintenances(any(Pageable.class))).thenReturn(pagedResponse);

                mockMvc.perform(get("/api/maintenance")
                                .param("page", "0")
                                .param("size", "10"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content[0].title").value("Olajcsere"));
        }

        @Test
        void getMaintenanceById_Success() throws Exception {
                when(machineMaintenanceService.getMaintenanceById(maintenanceId)).thenReturn(maintenanceResponse);

                mockMvc.perform(get("/api/maintenance/{id}", maintenanceId))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.id").value(maintenanceId.toString()))
                                .andExpect(jsonPath("$.title").value("Olajcsere"));
        }

        @Test
        void getMaintenanceById_NotFound_Returns404() throws Exception {
                when(machineMaintenanceService.getMaintenanceById(maintenanceId))
                                .thenThrow(new EntityNotFoundException("Karbantartás nem található!"));

                mockMvc.perform(get("/api/maintenance/{id}", maintenanceId))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.message").value("Karbantartás nem található!"));
        }

        @Test
        void createMaintenance_Success_Returns200() throws Exception {
                MachineMaintenanceCreateRequest request = MachineMaintenanceCreateRequest.builder()
                                .machineId(machineId)
                                .title("Olajcsere")
                                .status(MaintenanceStatus.SCHEDULED)
                                .type(MaintenanceType.PREVENTIVE)
                                .build();

                when(machineMaintenanceService.createMaintenance(any(MachineMaintenanceCreateRequest.class)))
                                .thenReturn(maintenanceResponse);

                mockMvc.perform(post("/api/maintenance")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.title").value("Olajcsere"));
        }

        @Test
        void updateMaintenanceStatus_Success() throws Exception {
                MachineMaintenanceStatusUpdateRequest request = new MachineMaintenanceStatusUpdateRequest();
                request.setStatus(MaintenanceStatus.COMPLETED);

                maintenanceResponse.setStatus(MaintenanceStatus.COMPLETED);
                when(machineMaintenanceService.updateMaintenanceStatus(eq(maintenanceId),
                                any(MachineMaintenanceStatusUpdateRequest.class)))
                                .thenReturn(maintenanceResponse);

                mockMvc.perform(patch("/api/maintenance/{id}/status", maintenanceId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.status").value("COMPLETED"));
        }

        @Test
        void deleteMaintenance_Returns204() throws Exception {
                mockMvc.perform(delete("/api/maintenance/{id}", maintenanceId))
                                .andExpect(status().isNoContent());

                verify(machineMaintenanceService).deleteMaintenance(maintenanceId);
        }
}
