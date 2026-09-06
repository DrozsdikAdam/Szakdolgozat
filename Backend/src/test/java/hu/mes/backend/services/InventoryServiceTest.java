/*
================================================================
Ez a fájl mesterséges intelligencia segítségével íródott. 
================================================================
*/
package hu.mes.backend.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
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
import hu.mes.backend.dtos.inventory.InventoryResponse;
import hu.mes.backend.dtos.inventory.InventoryUpdateRequest;
import hu.mes.backend.mappers.InventoryMapper;
import hu.mes.backend.models.Inventory;
import hu.mes.backend.models.Product;
import hu.mes.backend.models.enums.AuditAction;
import hu.mes.backend.models.enums.AuditEntityType;
import hu.mes.backend.models.enums.NotificationType;
import hu.mes.backend.repositories.InventoryRepository;
import jakarta.persistence.EntityNotFoundException;

@ExtendWith(MockitoExtension.class)
public class InventoryServiceTest {

    @InjectMocks
    private InventoryService inventoryService;

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private InventoryMapper inventoryMapper;

    @Mock
    private NotificationService notificationService;

    @Mock
    private AuditLogService auditLogService;

    private Product product;
    private Inventory inventory;
    private UUID productId;

    @BeforeEach
    void setUp() {
        productId = UUID.randomUUID();
        product = Product.builder()
                .name("Teszt Termék")
                .sku("SKU-100")
                .unit("db")
                .build();
        product.setId(productId);

        inventory = new Inventory();
        inventory.setProduct(product);
        inventory.setQuantity(BigDecimal.valueOf(100));
        inventory.setReservedQuantity(BigDecimal.valueOf(20));
        inventory.setLocation("A-01-01");
    }

    @Test
    void initializeInventory_ProductNull_ThrowsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class, () -> inventoryService.initializeInventory(null));
    }

    @Test
    void initializeInventory_AlreadyExists_DoesNothing() {
        when(inventoryRepository.findByProduct(product)).thenReturn(Optional.of(inventory));

        inventoryService.initializeInventory(product);

        verify(inventoryRepository, never()).save(any());
    }

    @Test
    void initializeInventory_NewProduct_SavesZeroInventory() {
        when(inventoryRepository.findByProduct(product)).thenReturn(Optional.empty());

        inventoryService.initializeInventory(product);

        verify(inventoryRepository).save(any(Inventory.class));
    }

    @Test
    void getInventoryByProductId_Success() {
        when(inventoryRepository.findByProductId(productId)).thenReturn(Optional.of(inventory));
        InventoryResponse response = new InventoryResponse();
        when(inventoryMapper.convertToResponse(inventory)).thenReturn(response);

        InventoryResponse result = inventoryService.getInventoryByProductId(productId);

        assertNotNull(result);
        verify(inventoryRepository).findByProductId(productId);
    }

    @Test
    void getInventoryByProductId_NotFound_ThrowsEntityNotFoundException() {
        when(inventoryRepository.findByProductId(productId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> inventoryService.getInventoryByProductId(productId));
    }

    @Test
    void adjustStock_Positive_IncreasesQuantityAndSaves() {
        InventoryUpdateRequest request = new InventoryUpdateRequest();
        request.setProductId(productId);
        request.setAmount(BigDecimal.valueOf(50));
        request.setLocation("B-02-02");

        when(inventoryRepository.findByProductId(productId)).thenReturn(Optional.of(inventory));
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(i -> i.getArgument(0));
        InventoryResponse response = new InventoryResponse();
        when(inventoryMapper.convertToResponse(any())).thenReturn(response);

        InventoryResponse result = inventoryService.adjustStock(request);

        assertNotNull(result);
        assertEquals(BigDecimal.valueOf(150), inventory.getQuantity());
        assertEquals("B-02-02", inventory.getLocation());
        verify(auditLogService).log(eq("WAREHOUSE"), any(), eq(AuditAction.STOCK_ADJUSTMENT),
                eq(AuditEntityType.INVENTORY), eq("SKU-100"), any());
    }

    @Test
    void adjustStock_NegativeBeyondZero_ThrowsIllegalArgumentException() {
        InventoryUpdateRequest request = new InventoryUpdateRequest();
        request.setProductId(productId);
        request.setAmount(BigDecimal.valueOf(-150)); // quantity 100 -> -50

        when(inventoryRepository.findByProductId(productId)).thenReturn(Optional.of(inventory));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> inventoryService.adjustStock(request));
        assertEquals("Nincs elegendő készlet!", ex.getMessage());

        verify(inventoryRepository, never()).save(any());
    }

    @Test
    void adjustStock_LowStock_TriggersNotification() {
        // Kezdet: quantity 100, reserved 20 -> available 80
        // amount: -75 -> quantity 25, reserved 20 -> available 5 (<= 10)
        InventoryUpdateRequest request = new InventoryUpdateRequest();
        request.setProductId(productId);
        request.setAmount(BigDecimal.valueOf(-75));

        when(inventoryRepository.findByProductId(productId)).thenReturn(Optional.of(inventory));
        when(inventoryRepository.save(any(Inventory.class))).thenReturn(inventory);

        inventoryService.adjustStock(request);

        verify(notificationService).send(any(), any(), eq(NotificationType.WARNING), eq("/inventory"));
    }

    @Test
    void reserveStock_Sufficient_IncreasesReserved() {
        // quantity 100, reserved 20 -> freeStock = 80
        InventoryUpdateRequest request = new InventoryUpdateRequest();
        request.setProductId(productId);
        request.setAmount(BigDecimal.valueOf(30));

        when(inventoryRepository.findByProductId(productId)).thenReturn(Optional.of(inventory));
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(i -> i.getArgument(0));
        when(inventoryMapper.convertToResponse(any())).thenReturn(new InventoryResponse());

        inventoryService.reserveStock(request);

        assertEquals(BigDecimal.valueOf(50), inventory.getReservedQuantity());
        verify(inventoryRepository).save(inventory);
    }

    @Test
    void reserveStock_Insufficient_ThrowsIllegalArgumentException() {
        // quantity 100, reserved 20 -> freeStock = 80
        InventoryUpdateRequest request = new InventoryUpdateRequest();
        request.setProductId(productId);
        request.setAmount(BigDecimal.valueOf(90));

        when(inventoryRepository.findByProductId(productId)).thenReturn(Optional.of(inventory));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> inventoryService.reserveStock(request));
        assertEquals("Nincs elegendő lefoglalható készlet!", ex.getMessage());

        verify(inventoryRepository, never()).save(any());
    }

    @Test
    void consumeReservedStock_Sufficient_DecreasesBoth() {
        // quantity 100, reserved 20 -> amount 10 -> quantity 90, reserved 10
        InventoryUpdateRequest request = new InventoryUpdateRequest();
        request.setProductId(productId);
        request.setAmount(BigDecimal.valueOf(10));

        when(inventoryRepository.findByProductId(productId)).thenReturn(Optional.of(inventory));
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(i -> i.getArgument(0));
        when(inventoryMapper.convertToResponse(any())).thenReturn(new InventoryResponse());

        inventoryService.consumeReservedStock(request);

        assertEquals(BigDecimal.valueOf(90), inventory.getQuantity());
        assertEquals(BigDecimal.valueOf(10), inventory.getReservedQuantity());
        verify(inventoryRepository).save(inventory);
    }

    @Test
    void consumeReservedStock_InsufficientReserved_ThrowsIllegalArgumentException() {
        InventoryUpdateRequest request = new InventoryUpdateRequest();
        request.setProductId(productId);
        request.setAmount(BigDecimal.valueOf(50)); // reserved is only 20

        when(inventoryRepository.findByProductId(productId)).thenReturn(Optional.of(inventory));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> inventoryService.consumeReservedStock(request));
        assertEquals("Nincs elegendő lefoglalt készlet!", ex.getMessage());

        verify(inventoryRepository, never()).save(any());
    }

    @Test
    void releaseReservedStock_Sufficient_DecreasesReserved() {
        // reserved 20 -> amount 15 -> reserved 5
        InventoryUpdateRequest request = new InventoryUpdateRequest();
        request.setProductId(productId);
        request.setAmount(BigDecimal.valueOf(15));

        when(inventoryRepository.findByProductId(productId)).thenReturn(Optional.of(inventory));
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(i -> i.getArgument(0));
        when(inventoryMapper.convertToResponse(any())).thenReturn(new InventoryResponse());

        inventoryService.releaseReservedStock(request);

        assertEquals(BigDecimal.valueOf(5), inventory.getReservedQuantity());
        verify(inventoryRepository).save(inventory);
    }

    @Test
    void releaseReservedStock_InsufficientReserved_ThrowsIllegalArgumentException() {
        InventoryUpdateRequest request = new InventoryUpdateRequest();
        request.setProductId(productId);
        request.setAmount(BigDecimal.valueOf(30)); // reserved is only 20

        when(inventoryRepository.findByProductId(productId)).thenReturn(Optional.of(inventory));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> inventoryService.releaseReservedStock(request));
        assertEquals("Nincs elegendő lefoglalt készlet!", ex.getMessage());

        verify(inventoryRepository, never()).save(any());
    }

    @Test
    void getAllInventories_Paged_ReturnsPagedResponse() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Inventory> page = new PageImpl<>(List.of(inventory));
        when(inventoryRepository.findAll(pageable)).thenReturn(page);
        when(inventoryMapper.convertToResponses(List.of(inventory))).thenReturn(List.of(new InventoryResponse()));

        PagedResponse<InventoryResponse> result = inventoryService.getAllInventories(pageable);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
    }

    @Test
    void getAllInventories_List_ReturnsAll() {
        when(inventoryRepository.findAll()).thenReturn(List.of(inventory));
        when(inventoryMapper.convertToResponses(List.of(inventory))).thenReturn(List.of(new InventoryResponse()));

        List<InventoryResponse> result = inventoryService.getAllInventories();

        assertNotNull(result);
        assertEquals(1, result.size());
    }
}
