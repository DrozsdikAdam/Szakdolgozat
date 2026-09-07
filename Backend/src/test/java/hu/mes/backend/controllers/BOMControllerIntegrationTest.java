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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;

import hu.mes.backend.dtos.bom.BOMItemRequest;
import hu.mes.backend.dtos.bom.BOMResponse;
import hu.mes.backend.dtos.bom.BOMTreeNode;
import hu.mes.backend.exceptions.GlobalExceptionHandler;
import hu.mes.backend.security.CustomUserDetailsService;
import hu.mes.backend.security.JwtAuthenticationFilter;
import hu.mes.backend.security.JwtUtils;
import hu.mes.backend.services.AuditLogService;
import hu.mes.backend.services.BOMService;

@WebMvcTest(controllers = BOMController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
public class BOMControllerIntegrationTest {

        @Autowired
        private MockMvc mockMvc;

        private ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

        @MockitoBean
        private BOMService bomService;

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

        private UUID parentId;
        private UUID componentId;

        @BeforeEach
        void setUp() {
                parentId = UUID.randomUUID();
                componentId = UUID.randomUUID();
        }

        @Test
        void addComponentToBOM_Success_Returns201() throws Exception {
                BOMItemRequest request = BOMItemRequest.builder()
                                .parentProductId(parentId)
                                .componentProductId(componentId)
                                .quantity(BigDecimal.valueOf(4))
                                .build();

                BOMResponse response = new BOMResponse();
                response.setId(UUID.randomUUID());
                response.setQuantity(BigDecimal.valueOf(4));

                when(bomService.addComponentToBOM(any(BOMItemRequest.class))).thenReturn(response);

                mockMvc.perform(post("/api/bom")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.quantity").value(4));
        }

        @Test
        void addComponentToBOM_InvalidQuantity_Returns400() throws Exception {
                BOMItemRequest request = BOMItemRequest.builder()
                                .parentProductId(parentId)
                                .componentProductId(componentId)
                                .quantity(BigDecimal.valueOf(0)) // DecimalMin 0.0001
                                .build();

                mockMvc.perform(post("/api/bom")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest());
        }

        @Test
        void getBOMTree_Success_Returns200() throws Exception {
                BOMTreeNode treeNode = new BOMTreeNode();
                treeNode.setProductId(parentId);
                treeNode.setProductName("Késztermék");
                treeNode.setQuantity(BigDecimal.valueOf(2));
                treeNode.setChildren(Collections.emptyList());

                when(bomService.getBOMTree(eq(parentId), eq(BigDecimal.valueOf(2)))).thenReturn(treeNode);

                mockMvc.perform(get("/api/bom/tree/{parentProductId}", parentId)
                                .param("quantity", "2"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.productId").value(parentId.toString()))
                                .andExpect(jsonPath("$.productName").value("Késztermék"));
        }

        @Test
        void addComponentToBOM_CyclicDependency_Returns400() throws Exception {
                BOMItemRequest request = BOMItemRequest.builder()
                                .parentProductId(parentId)
                                .componentProductId(componentId)
                                .quantity(BigDecimal.valueOf(2))
                                .build();

                when(bomService.addComponentToBOM(any(BOMItemRequest.class)))
                                .thenThrow(new IllegalArgumentException("Ciklikus függőség!"));

                mockMvc.perform(post("/api/bom")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message").value("Ciklikus függőség!"));
        }
}
