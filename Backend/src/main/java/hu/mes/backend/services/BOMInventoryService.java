package hu.mes.backend.services;

import java.math.BigDecimal;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import hu.mes.backend.dtos.bom.BOMTreeNode;
import hu.mes.backend.dtos.inventory.InventoryUpdateRequest;
import hu.mes.backend.models.Inventory;
import hu.mes.backend.models.Product;
import hu.mes.backend.repositories.InventoryRepository;
import jakarta.persistence.EntityNotFoundException;
import java.util.function.Consumer;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class BOMInventoryService {

    private final BOMService bomService;
    private final InventoryRepository inventoryRepository;
    private final InventoryService inventoryService;

    private void forEachLeafComponent(
            Product product,
            BigDecimal targetQuantity,
            Consumer<BOMTreeNode> action) {

        BOMTreeNode root = bomService.getBOMTree(product.getId(), targetQuantity);

        if (root == null || root.getChildren() == null || root.getChildren().isEmpty())
            return;

        for (BOMTreeNode child : root.getChildren())
            traverseLeaves(child, action);
    }

    private void traverseLeaves(BOMTreeNode node, Consumer<BOMTreeNode> action) {
        if (node == null)
            return;

        if (node.getChildren() == null || node.getChildren().isEmpty()) {
            action.accept(node);
            return;
        }

        for (BOMTreeNode child : node.getChildren())
            traverseLeaves(child, action);
    }

    public void validateComponentStock(Product product, BigDecimal targetQuantity) {
        forEachLeafComponent(product, targetQuantity, node -> validateSingleComponentStock(node));
    }

    private void validateSingleComponentStock(BOMTreeNode node) {
        if (node == null)
            return;

        if (node.getChildren() == null || node.getChildren().isEmpty()) {
            BigDecimal requiredQuantity = node.getQuantity();

            Inventory inv = inventoryRepository.findByProductId(node.getProductId())
                    .orElseThrow(() -> new EntityNotFoundException("Nincs raktáron!"));

            BigDecimal reservedQuantity = inv.getReservedQuantity() != null ? inv.getReservedQuantity()
                    : BigDecimal.ZERO;

            BigDecimal inventoryQuantity = inv.getQuantity() != null ? inv.getQuantity() : BigDecimal.ZERO;

            BigDecimal availableStock = inventoryQuantity.subtract(reservedQuantity);

            if (availableStock.compareTo(requiredQuantity) < 0)
                throw new IllegalStateException(
                        "Nincs elég " + node.getProductName() + " raktáron! Szükséges: " + requiredQuantity
                                + ", Elérhető: "
                                + availableStock);

            return;
        }
    }

    public void reserveComponentStock(Product product, BigDecimal targetQuantity) {
        forEachLeafComponent(product, targetQuantity,
                node -> inventoryService
                        .reserveStock(
                                new InventoryUpdateRequest(
                                        node.getProductId(),
                                        node.getQuantity(),
                                        null)));
    }

    public void consumeComponentStock(Product product, BigDecimal targetQuantity) {
        forEachLeafComponent(product, targetQuantity,
                node -> inventoryService.consumeReservedStock(
                        new InventoryUpdateRequest(
                                node.getProductId(),
                                node.getQuantity(),
                                null)));
    }

    public void releaseComponentStock(Product product, BigDecimal targetQuantity) {
        forEachLeafComponent(product, targetQuantity,
                node -> inventoryService.releaseReservedStock(
                        new InventoryUpdateRequest(
                                node.getProductId(),
                                node.getQuantity(),
                                null)));
    }

}
