package hu.mes.backend.mappers;

import java.util.List;

import org.springframework.stereotype.Component;

import hu.mes.backend.dtos.InventoryResponse;
import hu.mes.backend.models.Inventory;
import hu.mes.backend.models.Product;

@Component
public class InventoryMapper {
    public InventoryResponse convertToResponse(Inventory inventory) {
        Product product = inventory.getProduct();
        if (product == null) {
            return InventoryResponse.builder()
                    .id(inventory.getId())
                    .productId(null)
                    .productName("Törölt termék")
                    .productSku("N/A")
                    .quantity(inventory.getQuantity())
                    .reservedQuantity(inventory.getReservedQuantity())
                    .location(inventory.getLocation())
                    .updatedAt(inventory.getUpdatedAt())
                    .build();
        }
        return InventoryResponse.builder()
                .id(inventory.getId())
                .productId(product.getId())
                .productName(product.getName())
                .productSku(product.getSku())
                .quantity(inventory.getQuantity())
                .reservedQuantity(inventory.getReservedQuantity())
                .location(inventory.getLocation())
                .updatedAt(inventory.getUpdatedAt())
                .build();
    }

    public List<InventoryResponse> convertToResponses(List<Inventory> inventories) {
        return inventories.stream().map(this::convertToResponse).toList();
    }

}
