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
import hu.mes.backend.dtos.machine.EmergencyStopRequest;
import hu.mes.backend.dtos.machine.MachineCreateRequest;
import hu.mes.backend.dtos.machine.MachineResponse;
import hu.mes.backend.exceptions.GlobalExceptionHandler;
import hu.mes.backend.models.enums.MachineStatus;
import hu.mes.backend.models.enums.MachineType;
import hu.mes.backend.security.CustomUserDetailsService;
import hu.mes.backend.security.JwtAuthenticationFilter;
import hu.mes.backend.security.JwtUtils;
import hu.mes.backend.services.AuditLogService;
import hu.mes.backend.services.MachineService;
import jakarta.persistence.EntityNotFoundException;

@WebMvcTest(controllers = MachineController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
public class MachineControllerIntegrationTest {

        @Autowired
        private MockMvc mockMvc;

        private ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

        @MockitoBean
        private MachineService machineService;

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

        private UUID machineId;
        private MachineResponse machineResponse;

        @BeforeEach
        void setUp() {
                machineId = UUID.randomUUID();

                machineResponse = new MachineResponse();
                machineResponse.setId(machineId);
                machineResponse.setCode("CNC-01");
                machineResponse.setName("CNC Marógép 1");
                machineResponse.setType(MachineType.CNC);
                machineResponse.setStatus(MachineStatus.IDLE);
        }

        @Test
        void getAllMachines_ReturnsPagedMachines() throws Exception {
                Page<MachineResponse> page = new PageImpl<>(List.of(machineResponse));
                PagedResponse<MachineResponse> pagedResponse = PagedResponse.of(page, List.of(machineResponse));

                when(machineService.getAllMachines(any(Pageable.class))).thenReturn(pagedResponse);

                mockMvc.perform(get("/api/machines")
                                .param("page", "0")
                                .param("size", "10"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content[0].code").value("CNC-01"))
                                .andExpect(jsonPath("$.content[0].name").value("CNC Marógép 1"));
        }

        @Test
        void getMachineById_Success() throws Exception {
                when(machineService.getMachineById(machineId)).thenReturn(machineResponse);

                mockMvc.perform(get("/api/machines/{id}", machineId))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.id").value(machineId.toString()))
                                .andExpect(jsonPath("$.code").value("CNC-01"));
        }

        @Test
        void getMachineById_NotFound_Returns404() throws Exception {
                when(machineService.getMachineById(machineId))
                                .thenThrow(new EntityNotFoundException("A keresett gép nem található!"));

                mockMvc.perform(get("/api/machines/{id}", machineId))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.message").value("A keresett gép nem található!"));
        }

        @Test
        void createMachine_Success_Returns201() throws Exception {
                MachineCreateRequest request = MachineCreateRequest.builder()
                                .code("CNC-02")
                                .name("CNC Eszterga")
                                .type(MachineType.CNC)
                                .status(MachineStatus.IDLE)
                                .idealCycleTimeSeconds(60.0)
                                .targetPcsPerHour(50)
                                .build();

                when(machineService.createMachine(any(MachineCreateRequest.class))).thenReturn(machineResponse);

                mockMvc.perform(post("/api/machines")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.code").value("CNC-01"));
        }

        @Test
        void createMachine_ValidationFails_EmptyCode_Returns400() throws Exception {
                MachineCreateRequest request = MachineCreateRequest.builder()
                                .code("") // Blank kód
                                .name("CNC")
                                .type(MachineType.CNC)
                                .status(MachineStatus.IDLE)
                                .idealCycleTimeSeconds(60.0)
                                .targetPcsPerHour(50)
                                .build();

                mockMvc.perform(post("/api/machines")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest());
        }

        @Test
        void emergencyStop_Success() throws Exception {
                EmergencyStopRequest request = new EmergencyStopRequest();
                request.setReason("Füstölés");
                request.setDescription("Azonnali leállítás szükséges");

                machineResponse.setStatus(MachineStatus.ERROR);
                when(machineService.emergencyStop(eq(machineId), any(EmergencyStopRequest.class)))
                                .thenReturn(machineResponse);

                mockMvc.perform(post("/api/machines/{id}/emergency-stop", machineId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.status").value("ERROR"));
        }

        @Test
        void deleteMachine_Returns204() throws Exception {
                mockMvc.perform(delete("/api/machines/{id}", machineId))
                                .andExpect(status().isNoContent());

                verify(machineService).deleteMachine(machineId);
        }

        @Test
        void restoreMachine_Returns204() throws Exception {
                mockMvc.perform(patch("/api/machines/{id}/restore", machineId))
                                .andExpect(status().isNoContent());

                verify(machineService).restoreMachine(machineId);
        }
}
