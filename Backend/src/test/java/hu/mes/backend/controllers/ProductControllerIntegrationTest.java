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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
import hu.mes.backend.dtos.product.ProductCreateRequest;
import hu.mes.backend.dtos.product.ProductResponse;
import hu.mes.backend.dtos.product.ProductUpdateRequest;
import hu.mes.backend.exceptions.GlobalExceptionHandler;
import hu.mes.backend.security.CustomUserDetailsService;
import hu.mes.backend.security.JwtAuthenticationFilter;
import hu.mes.backend.security.JwtUtils;
import hu.mes.backend.services.AuditLogService;
import hu.mes.backend.services.ProductService;
import jakarta.persistence.EntityNotFoundException;

@WebMvcTest(controllers = ProductController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
public class ProductControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @MockitoBean
    private ProductService productService;

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
    private ProductResponse productResponse;

    @BeforeEach
    void setUp() {
        productId = UUID.randomUUID();

        productResponse = new ProductResponse();
        productResponse.setId(productId);
        productResponse.setName("Csapágyház");
        productResponse.setSku("CSAP-001");
        productResponse.setUnit("db");
        productResponse.setActive(true);
    }

    @Test
    void getAllProducts_ReturnsPagedProducts() throws Exception {
        Page<ProductResponse> page = new PageImpl<>(List.of(productResponse));
        PagedResponse<ProductResponse> pagedResponse = PagedResponse.of(page, List.of(productResponse));

        when(productService.getAllProducts(any(Pageable.class))).thenReturn(pagedResponse);

        mockMvc.perform(get("/api/products")
                .param("page", "0")
                .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].name").value("Csapágyház"))
                .andExpect(jsonPath("$.content[0].sku").value("CSAP-001"));
    }

    @Test
    void getProductById_Success() throws Exception {
        when(productService.getProductById(productId)).thenReturn(productResponse);

        mockMvc.perform(get("/api/products/{id}", productId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(productId.toString()))
                .andExpect(jsonPath("$.name").value("Csapágyház"));
    }

    @Test
    void getProductById_NotFound_Returns404() throws Exception {
        when(productService.getProductById(productId))
                .thenThrow(new EntityNotFoundException("A keresett termék nem található!"));

        mockMvc.perform(get("/api/products/{id}", productId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("A keresett termék nem található!"));
    }

    @Test
    void createProduct_Success_Returns201() throws Exception {
        ProductCreateRequest request = new ProductCreateRequest("Csapágyház", "CSAP-001", "Öntöttvas", "db");

        when(productService.createProduct(any(ProductCreateRequest.class))).thenReturn(productResponse);

        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sku").value("CSAP-001"));
    }

    @Test
    void createProduct_InvalidSkuPattern_Returns400() throws Exception {
        ProductCreateRequest request = new ProductCreateRequest("Csapágyház", "CSAP 001!", "Öntöttvas", "db"); // érvénytelen
                                                                                                               // karakterek

        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateProduct_Success_Returns200() throws Exception {
        ProductUpdateRequest request = new ProductUpdateRequest();
        request.setName("Módosított Csapágyház");
        request.setSku("CSAP-002");
        request.setUnit("db");

        productResponse.setName("Módosított Csapágyház");
        productResponse.setSku("CSAP-002");
        when(productService.updateProduct(eq(productId), any(ProductUpdateRequest.class))).thenReturn(productResponse);

        mockMvc.perform(put("/api/products/{id}", productId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Módosított Csapágyház"))
                .andExpect(jsonPath("$.sku").value("CSAP-002"));
    }

    @Test
    void deleteProduct_Returns204() throws Exception {
        mockMvc.perform(delete("/api/products/{id}", productId))
                .andExpect(status().isNoContent());

        verify(productService).deleteProduct(productId);
    }

    @Test
    void restoreProduct_Returns204() throws Exception {
        mockMvc.perform(put("/api/products/{id}/restore", productId))
                .andExpect(status().isNoContent());

        verify(productService).restoreProduct(productId);
    }
}
