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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
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
import hu.mes.backend.dtos.workorder.WorkOrderCreateRequest;
import hu.mes.backend.dtos.workorder.WorkOrderResponse;
import hu.mes.backend.dtos.workorder.WorkOrderStatusUpdateRequest;
import hu.mes.backend.exceptions.GlobalExceptionHandler;
import hu.mes.backend.models.enums.WorkOrderPriority;
import hu.mes.backend.models.enums.WorkOrderStatus;
import hu.mes.backend.security.CustomUserDetailsService;
import hu.mes.backend.security.JwtAuthenticationFilter;
import hu.mes.backend.security.JwtUtils;
import hu.mes.backend.services.AuditLogService;
import hu.mes.backend.services.WorkOrderService;
import jakarta.persistence.EntityNotFoundException;

@WebMvcTest(controllers = WorkOrderController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
public class WorkOrderControllerIntegrationTest {

        @Autowired
        private MockMvc mockMvc;

        private ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

        @MockitoBean
        private WorkOrderService workOrderService;

        @MockitoBean
        private CacheManager cacheManager;

        @MockitoBean
        private AuditLogService auditLogService;

        @MockitoBean
        private JwtAuthenticationFilter jwtAuthenticationFilter;

        @MockitoBean
        private JwtUtils jwtUtils;

        @MockitoBean
        private CustomUserDetailsService customUserDetailsService;

        private UUID workOrderId;
        private UUID productId;
        private WorkOrderResponse workOrderResponse;

        @BeforeEach
        void setUp() {
                workOrderId = UUID.randomUUID();
                productId = UUID.randomUUID();

                workOrderResponse = new WorkOrderResponse();
                workOrderResponse.setId(workOrderId);
                workOrderResponse.setOrderNumber("WO-2026-0001");
                workOrderResponse.setStatus(WorkOrderStatus.PLANNED);
                workOrderResponse.setPriority(WorkOrderPriority.MEDIUM);
                workOrderResponse.setCustomerName("ACME Kft.");
                workOrderResponse.setTargetQuantity(BigDecimal.valueOf(100));
        }

        @Test
        void getAll_ReturnsPagedWorkOrders() throws Exception {
                Page<WorkOrderResponse> page = new PageImpl<>(List.of(workOrderResponse));
                PagedResponse<WorkOrderResponse> pagedResponse = PagedResponse.of(page, List.of(workOrderResponse));

                when(workOrderService.getAllWorkOrders(any(), any(Pageable.class))).thenReturn(pagedResponse);

                mockMvc.perform(get("/api/work-orders")
                                .param("page", "0")
                                .param("size", "10"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content[0].orderNumber").value("WO-2026-0001"))
                                .andExpect(jsonPath("$.content[0].customerName").value("ACME Kft."));
        }

        @Test
        void getById_Success() throws Exception {
                when(workOrderService.getWorkOrderById(workOrderId)).thenReturn(workOrderResponse);

                mockMvc.perform(get("/api/work-orders/{id}", workOrderId))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.id").value(workOrderId.toString()))
                                .andExpect(jsonPath("$.orderNumber").value("WO-2026-0001"));
        }

        @Test
        void getById_NotFound_Returns404() throws Exception {
                when(workOrderService.getWorkOrderById(workOrderId))
                                .thenThrow(new EntityNotFoundException("A keresett gyártási rendelés nem található!"));

                mockMvc.perform(get("/api/work-orders/{id}", workOrderId))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.message").value("A keresett gyártási rendelés nem található!"));
        }

        @Test
        void createWorkOrder_Success_Returns201() throws Exception {
                WorkOrderCreateRequest request = WorkOrderCreateRequest.builder()
                                .productId(productId)
                                .targetQuantity(BigDecimal.valueOf(100))
                                .status(WorkOrderStatus.PLANNED)
                                .priority(WorkOrderPriority.HIGH)
                                .customerName("Tesla Motors")
                                .build();

                when(workOrderService.createWorkOrder(any(WorkOrderCreateRequest.class))).thenReturn(workOrderResponse);

                mockMvc.perform(post("/api/work-orders")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.orderNumber").value("WO-2026-0001"));
        }

        @Test
        void createWorkOrder_ValidationFails_MissingCustomer_Returns400() throws Exception {
                WorkOrderCreateRequest request = WorkOrderCreateRequest.builder()
                                .productId(productId)
                                .targetQuantity(BigDecimal.valueOf(100))
                                .status(WorkOrderStatus.PLANNED)
                                .priority(WorkOrderPriority.HIGH)
                                .customerName(null) // NotNull validáció megsértése
                                .build();

                mockMvc.perform(post("/api/work-orders")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest());
        }

        @Test
        void updateStatus_Success_ReturnsUpdatedWorkOrder() throws Exception {
                WorkOrderStatusUpdateRequest request = new WorkOrderStatusUpdateRequest();
                request.setStatus(WorkOrderStatus.IN_PROGRESS);
                request.setProducedQuantity(BigDecimal.valueOf(10));
                request.setScrapQuantity(BigDecimal.ZERO);

                workOrderResponse.setStatus(WorkOrderStatus.IN_PROGRESS);
                when(workOrderService.updateWorkOrderStatus(eq(workOrderId), any(WorkOrderStatusUpdateRequest.class)))
                                .thenReturn(workOrderResponse);

                mockMvc.perform(patch("/api/work-orders/{id}/status", workOrderId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
        }

        @Test
        void updateWorkOrderUser_Success() throws Exception {
                UUID userId = UUID.randomUUID();
                when(workOrderService.updateWorkOrderUser(workOrderId, userId)).thenReturn(workOrderResponse);

                mockMvc.perform(patch("/api/work-orders/{id}/user/{userId}", workOrderId, userId))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.id").value(workOrderId.toString()));
        }
}
