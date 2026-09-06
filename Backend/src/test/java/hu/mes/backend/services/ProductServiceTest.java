/*
================================================================
Ez a fájl mesterséges intelligencia segítségével íródott. 
================================================================
*/
package hu.mes.backend.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import hu.mes.backend.dtos.common.PagedResponse;
import hu.mes.backend.dtos.product.ProductCreateRequest;
import hu.mes.backend.dtos.product.ProductResponse;
import hu.mes.backend.dtos.product.ProductUpdateRequest;
import hu.mes.backend.mappers.ProductMapper;
import hu.mes.backend.models.Product;
import hu.mes.backend.models.enums.AuditAction;
import hu.mes.backend.models.enums.AuditEntityType;
import hu.mes.backend.repositories.ProductRepository;
import jakarta.persistence.EntityNotFoundException;

@ExtendWith(MockitoExtension.class)
public class ProductServiceTest {

    @InjectMocks
    private ProductService productService;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductMapper productMapper;

    @Mock
    private InventoryService inventoryService;

    @Mock
    private AuditLogService auditLogService;

    private Product product;
    private UUID productId;

    @BeforeEach
    void setUp() {
        productId = UUID.randomUUID();
        product = Product.builder()
                .name("Fogaskerék")
                .sku("FOG-001")
                .description("Precíziós fogaskerék")
                .unit("db")
                .active(true)
                .deleted(false)
                .build();
        product.setId(productId);
    }

    @Test
    void createProduct_Success() {
        ProductCreateRequest request = new ProductCreateRequest();
        request.setName("Fogaskerék");
        request.setSku("FOG-001");
        request.setDescription("Precíziós fogaskerék");
        request.setUnit("db");

        when(productRepository.existsBySku("FOG-001")).thenReturn(false);
        when(productRepository.save(any(Product.class))).thenAnswer(i -> {
            Product p = i.getArgument(0);
            p.setId(productId);
            return p;
        });
        ProductResponse response = new ProductResponse();
        when(productMapper.convertToResponse(any())).thenReturn(response);

        ProductResponse result = productService.createProduct(request);

        assertNotNull(result);
        verify(productRepository).save(any(Product.class));
        verify(inventoryService).initializeInventory(any(Product.class));
        verify(auditLogService).log(eq(AuditAction.CREATE), eq(AuditEntityType.PRODUCT), eq("FOG-001"), any());
    }

    @Test
    void createProduct_NullRequest_ThrowsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class, () -> productService.createProduct(null));
        verify(productRepository, never()).save(any());
    }

    @Test
    void createProduct_DuplicateSku_ThrowsIllegalArgumentException() {
        ProductCreateRequest request = new ProductCreateRequest();
        request.setSku("FOG-001");

        when(productRepository.existsBySku("FOG-001")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> productService.createProduct(request));
        verify(productRepository, never()).save(any());
    }

    @Test
    void getAllProducts_ReturnsPagedResponse() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Product> page = new PageImpl<>(List.of(product));
        when(productRepository.findByActiveTrueAndDeletedFalse(pageable)).thenReturn(page);
        when(productMapper.convertToResponses(List.of(product))).thenReturn(List.of(new ProductResponse()));

        PagedResponse<ProductResponse> result = productService.getAllProducts(pageable);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
    }

    @Test
    void getActiveProducts_ReturnsList() {
        when(productRepository.findByActiveTrueAndDeletedFalse()).thenReturn(List.of(product));
        when(productMapper.convertToResponses(List.of(product))).thenReturn(List.of(new ProductResponse()));

        List<ProductResponse> result = productService.getActiveProducts();

        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    void getProductById_Success() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(productMapper.convertToResponse(product)).thenReturn(new ProductResponse());

        ProductResponse response = productService.getProductById(productId);

        assertNotNull(response);
    }

    @Test
    void getProductById_NotFound_ThrowsEntityNotFoundException() {
        when(productRepository.findById(productId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> productService.getProductById(productId));
    }

    @Test
    void deleteProduct_SetsDeletedTrueAndActiveFalse() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenAnswer(i -> i.getArgument(0));

        productService.deleteProduct(productId);

        assertTrue(product.getDeleted());
        assertFalse(product.getActive());
        verify(auditLogService).log(eq(AuditAction.DELETE), eq(AuditEntityType.PRODUCT), eq("FOG-001"), any());
    }

    @Test
    void updateProduct_Success() {
        ProductUpdateRequest request = new ProductUpdateRequest();
        request.setName("Módosított Fogaskerék");
        request.setSku("FOG-001-NEW");
        request.setDescription("Új leírás");
        request.setUnit("db");

        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(productRepository.existsBySku("FOG-001-NEW")).thenReturn(false);
        when(productRepository.save(any(Product.class))).thenAnswer(i -> i.getArgument(0));
        when(productMapper.convertToResponse(any())).thenReturn(new ProductResponse());

        ProductResponse response = productService.updateProduct(productId, request);

        assertNotNull(response);
        assertEquals("Módosított Fogaskerék", product.getName());
        assertEquals("FOG-001-NEW", product.getSku());
        verify(auditLogService).log(eq(AuditAction.UPDATE), eq(AuditEntityType.PRODUCT), eq("FOG-001-NEW"), any());
    }

    @Test
    void updateProduct_DuplicateSku_ThrowsIllegalArgumentException() {
        ProductUpdateRequest request = new ProductUpdateRequest();
        request.setSku("OTHER-SKU");

        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(productRepository.existsBySku("OTHER-SKU")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> productService.updateProduct(productId, request));
        verify(productRepository, never()).save(any());
    }

    @Test
    void getDeletedProducts_Success() {
        when(productRepository.findByDeletedTrue()).thenReturn(List.of(product));
        when(productMapper.convertToResponses(List.of(product))).thenReturn(List.of(new ProductResponse()));

        List<ProductResponse> list = productService.getDeletedProducts();

        assertNotNull(list);
        assertEquals(1, list.size());
    }

    @Test
    void getInactiveProducts_Success() {
        when(productRepository.findByActiveFalseAndDeletedFalse()).thenReturn(List.of(product));
        when(productMapper.convertToResponses(List.of(product))).thenReturn(List.of(new ProductResponse()));

        List<ProductResponse> list = productService.getInactiveProducts();

        assertNotNull(list);
        assertEquals(1, list.size());
    }

    @Test
    void updateProductActiveStatus_Success() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));

        productService.updateProductActiveStatus(productId, false, "deaktiválva");

        assertFalse(product.getActive());
        verify(productRepository).save(product);
        verify(auditLogService).log(eq(AuditAction.STATUS_CHANGE), eq(AuditEntityType.PRODUCT), eq("FOG-001"), any());
    }

    @Test
    void restoreProduct_Success() {
        product.setDeleted(true);
        product.setActive(false);
        when(productRepository.findByIdAndDeletedTrue(productId)).thenReturn(Optional.of(product));

        productService.restoreProduct(productId);

        assertFalse(product.getDeleted());
        assertTrue(product.getActive());
        verify(productRepository).save(product);
        verify(auditLogService).log(eq(AuditAction.UPDATE), eq(AuditEntityType.PRODUCT), eq("FOG-001"), any());
    }

    @Test
    void restoreProduct_NotFound_ThrowsEntityNotFoundException() {
        when(productRepository.findByIdAndDeletedTrue(productId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> productService.restoreProduct(productId));
    }
}
