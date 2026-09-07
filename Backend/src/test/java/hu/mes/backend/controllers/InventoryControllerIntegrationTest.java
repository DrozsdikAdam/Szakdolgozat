/*
================================================================
Ez a fájl mesterséges intelligencia segítségével íródott. 
================================================================
*/
package hu.mes.backend.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
import hu.mes.backend.dtos.inventory.InventoryResponse;
import hu.mes.backend.dtos.inventory.InventoryUpdateRequest;
import hu.mes.backend.exceptions.GlobalExceptionHandler;
import hu.mes.backend.security.CustomUserDetailsService;
import hu.mes.backend.security.JwtAuthenticationFilter;
import hu.mes.backend.security.JwtUtils;
import hu.mes.backend.services.AuditLogService;
import hu.mes.backend.services.InventoryService;
import jakarta.persistence.EntityNotFoundException;

@WebMvcTest(controllers = InventoryController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
public class InventoryControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @MockitoBean
    private InventoryService inventoryService;

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

    private UUID productId;
    private InventoryResponse inventoryResponse;

    @BeforeEach
    void setUp() {
        productId = UUID.randomUUID();

        inventoryResponse = new InventoryResponse();
        inventoryResponse.setProductId(productId);
        inventoryResponse.setQuantity(BigDecimal.valueOf(100));
        inventoryResponse.setReservedQuantity(BigDecimal.valueOf(20));
        inventoryResponse.setLocation("A-01-01");
    }

    @Test
    void getAllInventoryItems_ReturnsPagedInventory() throws Exception {
        Page<InventoryResponse> page = new PageImpl<>(List.of(inventoryResponse));
        PagedResponse<InventoryResponse> pagedResponse = PagedResponse.of(page, List.of(inventoryResponse));

        when(inventoryService.getAllInventories(any(Pageable.class))).thenReturn(pagedResponse);

        mockMvc.perform(get("/api/inventory")
                .param("page", "0")
                .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].location").value("A-01-01"))
                .andExpect(jsonPath("$.content[0].quantity").value(100));
    }

    @Test
    void getInventoryByProductId_Success() throws Exception {
        when(inventoryService.getInventoryByProductId(productId)).thenReturn(inventoryResponse);

        mockMvc.perform(get("/api/inventory/product/{productId}", productId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.productId").value(productId.toString()))
                .andExpect(jsonPath("$.quantity").value(100));
    }

    @Test
    void getInventoryByProductId_NotFound_Returns404() throws Exception {
        when(inventoryService.getInventoryByProductId(productId))
                .thenThrow(new EntityNotFoundException("A termékhez nem tartozik nyilvántartás!"));

        mockMvc.perform(get("/api/inventory/product/{productId}", productId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("A termékhez nem tartozik nyilvántartás!"));
    }

    @Test
    void adjustStock_Success_Returns201() throws Exception {
        InventoryUpdateRequest request = new InventoryUpdateRequest(productId, BigDecimal.valueOf(50), "B-02");
        inventoryResponse.setQuantity(BigDecimal.valueOf(150));

        when(inventoryService.adjustStock(any(InventoryUpdateRequest.class))).thenReturn(inventoryResponse);

        mockMvc.perform(post("/api/inventory/adjust")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.quantity").value(150));
    }

    @Test
    void reserveStock_Success_Returns201() throws Exception {
        InventoryUpdateRequest request = new InventoryUpdateRequest(productId, BigDecimal.valueOf(10), null);
        inventoryResponse.setReservedQuantity(BigDecimal.valueOf(30));

        when(inventoryService.reserveStock(any(InventoryUpdateRequest.class))).thenReturn(inventoryResponse);

        mockMvc.perform(post("/api/inventory/reserve")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.reservedQuantity").value(30));
    }

    @Test
    void consumeStock_Success_Returns201() throws Exception {
        InventoryUpdateRequest request = new InventoryUpdateRequest(productId, BigDecimal.valueOf(10), null);
        inventoryResponse.setQuantity(BigDecimal.valueOf(90));
        inventoryResponse.setReservedQuantity(BigDecimal.valueOf(10));

        when(inventoryService.consumeReservedStock(any(InventoryUpdateRequest.class))).thenReturn(inventoryResponse);

        mockMvc.perform(post("/api/inventory/consume")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.quantity").value(90))
                .andExpect(jsonPath("$.reservedQuantity").value(10));
    }

    @Test
    void releaseStock_Success_Returns201() throws Exception {
        InventoryUpdateRequest request = new InventoryUpdateRequest(productId, BigDecimal.valueOf(10), null);
        inventoryResponse.setReservedQuantity(BigDecimal.valueOf(10));

        when(inventoryService.releaseReservedStock(any(InventoryUpdateRequest.class))).thenReturn(inventoryResponse);

        mockMvc.perform(post("/api/inventory/release")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.reservedQuantity").value(10));
    }
}
