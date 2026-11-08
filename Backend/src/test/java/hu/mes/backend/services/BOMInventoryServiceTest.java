/*
================================================================
Ez a fájl mesterséges intelligencia segítségével íródott. 
================================================================
*/
package hu.mes.backend.services;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import hu.mes.backend.dtos.bom.BOMTreeNode;
import hu.mes.backend.dtos.inventory.InventoryUpdateRequest;
import hu.mes.backend.models.Inventory;
import hu.mes.backend.models.Product;
import hu.mes.backend.repositories.InventoryRepository;
import jakarta.persistence.EntityNotFoundException;

@ExtendWith(MockitoExtension.class)
public class BOMInventoryServiceTest {

    @InjectMocks
    private BOMInventoryService bomInventoryService;

    @Mock
    private BOMService bomService;

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private InventoryService inventoryService;

    @Test
    void validateComponentStock_SufficientStock_DoesNotThrow() {
        Product parent = new Product();
        parent.setId(UUID.randomUUID());

        UUID compId = UUID.randomUUID();
        BOMTreeNode child = new BOMTreeNode();
        child.setProductId(compId);
        child.setProductName("Screw M6");
        child.setQuantity(BigDecimal.valueOf(10));
        child.setChildren(Collections.emptyList());

        BOMTreeNode root = new BOMTreeNode();
        root.setProductId(parent.getId());
        root.setChildren(List.of(child));

        Inventory inventory = new Inventory();
        inventory.setQuantity(BigDecimal.valueOf(100));
        inventory.setReservedQuantity(BigDecimal.valueOf(20)); // available = 80 >= 10

        when(bomService.getBOMTree(parent.getId(), BigDecimal.valueOf(5))).thenReturn(root);
        when(inventoryRepository.findByProductId(compId)).thenReturn(Optional.of(inventory));

        assertDoesNotThrow(() -> bomInventoryService.validateComponentStock(parent, BigDecimal.valueOf(5)));
    }

    @Test
    void validateComponentStock_InsufficientStock_ThrowsIllegalStateException() {
        Product parent = new Product();
        parent.setId(UUID.randomUUID());

        UUID compId = UUID.randomUUID();
        BOMTreeNode child = new BOMTreeNode();
        child.setProductId(compId);
        child.setProductName("Steel Plate");
        child.setQuantity(BigDecimal.valueOf(50));
        child.setChildren(Collections.emptyList());

        BOMTreeNode root = new BOMTreeNode();
        root.setProductId(parent.getId());
        root.setChildren(List.of(child));

        Inventory inventory = new Inventory();
        inventory.setQuantity(BigDecimal.valueOf(30));
        inventory.setReservedQuantity(BigDecimal.ZERO); // available = 30 < 50

        when(bomService.getBOMTree(parent.getId(), BigDecimal.valueOf(1))).thenReturn(root);
        when(inventoryRepository.findByProductId(compId)).thenReturn(Optional.of(inventory));

        assertThrows(IllegalStateException.class,
                () -> bomInventoryService.validateComponentStock(parent, BigDecimal.valueOf(1)));
    }

    @Test
    void validateComponentStock_ComponentNotInInventory_ThrowsEntityNotFoundException() {
        Product parent = new Product();
        parent.setId(UUID.randomUUID());

        UUID compId = UUID.randomUUID();
        BOMTreeNode child = new BOMTreeNode();
        child.setProductId(compId);
        child.setQuantity(BigDecimal.valueOf(5));
        child.setChildren(Collections.emptyList());

        BOMTreeNode root = new BOMTreeNode();
        root.setProductId(parent.getId());
        root.setChildren(List.of(child));

        when(bomService.getBOMTree(parent.getId(), BigDecimal.valueOf(1))).thenReturn(root);
        when(inventoryRepository.findByProductId(compId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class,
                () -> bomInventoryService.validateComponentStock(parent, BigDecimal.valueOf(1)));
    }

    @Test
    void validateComponentStock_EmptyTree_ThrowsIllegalStateException() {
        Product parent = new Product();
        parent.setId(UUID.randomUUID());
        parent.setName("Test Product");

        BOMTreeNode root = new BOMTreeNode();
        root.setProductId(parent.getId());
        root.setChildren(Collections.emptyList());

        when(bomService.getBOMTree(parent.getId(), BigDecimal.valueOf(1))).thenReturn(root);

        assertThrows(IllegalStateException.class,
                () -> bomInventoryService.validateComponentStock(parent, BigDecimal.valueOf(1)));
        verify(inventoryRepository, never()).findByProductId(any());
    }

    @Test
    void reserveComponentStock_CallsInventoryServiceReserve() {
        Product parent = new Product();
        parent.setId(UUID.randomUUID());

        UUID compId = UUID.randomUUID();
        BOMTreeNode child = new BOMTreeNode();
        child.setProductId(compId);
        child.setQuantity(BigDecimal.valueOf(15));
        child.setChildren(Collections.emptyList());

        BOMTreeNode root = new BOMTreeNode();
        root.setProductId(parent.getId());
        root.setChildren(List.of(child));

        when(bomService.getBOMTree(parent.getId(), BigDecimal.valueOf(2))).thenReturn(root);

        bomInventoryService.reserveComponentStock(parent, BigDecimal.valueOf(2));

        verify(inventoryService).reserveStock(any(InventoryUpdateRequest.class));
    }

    @Test
    void consumeComponentStock_CallsInventoryServiceConsume() {
        Product parent = new Product();
        parent.setId(UUID.randomUUID());

        UUID compId = UUID.randomUUID();
        BOMTreeNode child = new BOMTreeNode();
        child.setProductId(compId);
        child.setQuantity(BigDecimal.valueOf(15));
        child.setChildren(Collections.emptyList());

        BOMTreeNode root = new BOMTreeNode();
        root.setProductId(parent.getId());
        root.setChildren(List.of(child));

        when(bomService.getBOMTree(parent.getId(), BigDecimal.valueOf(2))).thenReturn(root);

        bomInventoryService.consumeComponentStock(parent, BigDecimal.valueOf(2));

        verify(inventoryService).consumeReservedStock(any(InventoryUpdateRequest.class));
    }

    @Test
    void releaseComponentStock_CallsInventoryServiceRelease() {
        Product parent = new Product();
        parent.setId(UUID.randomUUID());

        UUID compId = UUID.randomUUID();
        BOMTreeNode child = new BOMTreeNode();
        child.setProductId(compId);
        child.setQuantity(BigDecimal.valueOf(15));
        child.setChildren(Collections.emptyList());

        BOMTreeNode root = new BOMTreeNode();
        root.setProductId(parent.getId());
        root.setChildren(List.of(child));

        when(bomService.getBOMTree(parent.getId(), BigDecimal.valueOf(2))).thenReturn(root);

        bomInventoryService.releaseComponentStock(parent, BigDecimal.valueOf(2));

        verify(inventoryService).releaseReservedStock(any(InventoryUpdateRequest.class));
    }

}
