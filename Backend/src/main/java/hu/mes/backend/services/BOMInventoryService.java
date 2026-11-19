package hu.mes.backend.services;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import hu.mes.backend.dtos.bom.BOMTreeNode;
import hu.mes.backend.dtos.inventory.InventoryUpdateRequest;
import hu.mes.backend.models.Inventory;
import hu.mes.backend.models.Product;
import hu.mes.backend.repositories.InventoryRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class BOMInventoryService {

    private final BOMService bomService;
    private final InventoryRepository inventoryRepository;
    private final InventoryService inventoryService;

    public record ComponentRequirement(UUID productId, String productName, BigDecimal quantity) {}

    private Map<UUID, ComponentRequirement> getAggregatedLeafComponents(Product product, BigDecimal targetQuantity) {
        BOMTreeNode root = bomService.getBOMTree(product.getId(), targetQuantity);

        if (root == null || root.getChildren() == null || root.getChildren().isEmpty()) {
            throw new IllegalStateException(
                    "A(z) '" + (product != null ? product.getName() : "") + "' termékhez nem tartozik gyártási darabjegyzék (BOM)! " +
                    "A gyártás előkészítése nem lehetséges darabjegyzék nélkül. Kérjük, előbb rögzítsen összetevőket a Gyártási tervek menüpontban.");
        }

        Map<UUID, ComponentRequirement> map = new HashMap<>();
        for (BOMTreeNode child : root.getChildren()) {
            collectLeaves(child, map);
        }
        return map;
    }

    private void collectLeaves(BOMTreeNode node, Map<UUID, ComponentRequirement> map) {
        if (node == null)
            return;

        if (node.getChildren() == null || node.getChildren().isEmpty()) {
            map.compute(node.getProductId(), (k, v) -> {
                if (v == null) {
                    return new ComponentRequirement(node.getProductId(), node.getProductName(), node.getQuantity());
                } else {
                    return new ComponentRequirement(node.getProductId(), node.getProductName(), v.quantity().add(node.getQuantity()));
                }
            });
            return;
        }

        for (BOMTreeNode child : node.getChildren()) {
            collectLeaves(child, map);
        }
    }

    public void validateComponentStock(Product product, BigDecimal targetQuantity) {
        Map<UUID, ComponentRequirement> requirements = getAggregatedLeafComponents(product, targetQuantity);

        for (ComponentRequirement req : requirements.values()) {
            Inventory inv = inventoryRepository.findByProductId(req.productId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "A(z) " + req.productName() + " alkatrészhez nem található raktári nyilvántartás!"));

            BigDecimal reservedQuantity = inv.getReservedQuantity() != null ? inv.getReservedQuantity()
                    : BigDecimal.ZERO;
            BigDecimal inventoryQuantity = inv.getQuantity() != null ? inv.getQuantity() : BigDecimal.ZERO;
            BigDecimal availableStock = inventoryQuantity.subtract(reservedQuantity);

            if (availableStock.compareTo(req.quantity()) < 0) {
                throw new IllegalStateException(
                        "Nincs elég " + req.productName() + " raktáron! Szükséges: " + req.quantity()
                                + ", Elérhető: " + availableStock);
            }
        }
    }

    public void reserveComponentStock(Product product, BigDecimal targetQuantity) {
        Map<UUID, ComponentRequirement> requirements = getAggregatedLeafComponents(product, targetQuantity);

        for (ComponentRequirement req : requirements.values()) {
            inventoryService.reserveStock(new InventoryUpdateRequest(
                    req.productId(),
                    req.quantity(),
                    null));
        }
    }

    public void consumeComponentStock(Product product, BigDecimal targetQuantity) {
        BOMTreeNode root = bomService.getBOMTree(product.getId(), targetQuantity);
        if (root == null || root.getChildren() == null || root.getChildren().isEmpty()) {
            return;
        }

        Map<UUID, ComponentRequirement> map = new HashMap<>();
        for (BOMTreeNode child : root.getChildren()) {
            collectLeaves(child, map);
        }

        for (ComponentRequirement req : map.values()) {
            inventoryService.consumeReservedStock(new InventoryUpdateRequest(
                    req.productId(),
                    req.quantity(),
                    null));
        }
    }

    public void releaseComponentStock(Product product, BigDecimal targetQuantity) {
        BOMTreeNode root = bomService.getBOMTree(product.getId(), targetQuantity);
        if (root == null || root.getChildren() == null || root.getChildren().isEmpty()) {
            return;
        }

        Map<UUID, ComponentRequirement> map = new HashMap<>();
        for (BOMTreeNode child : root.getChildren()) {
            collectLeaves(child, map);
        }

        for (ComponentRequirement req : map.values()) {
            inventoryService.releaseReservedStock(new InventoryUpdateRequest(
                    req.productId(),
                    req.quantity(),
                    null));
        }
    }

}

