package hu.mes.backend.mappers;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Component;

import hu.mes.backend.dtos.inventory.InventoryResponse;
import hu.mes.backend.models.Inventory;
import hu.mes.backend.models.Product;

@Component
public class InventoryMapper {
    public InventoryResponse convertToResponse(Inventory inventory) {
        Product product = inventory.getProduct();
        UUID id = null;
        String name = null;
        String sku = null;

        if (product != null) {
            id = product.getId();
            name = product.getName();
            sku = product.getSku();
        } else {
            id = null;
            name = "Törölt termék";
            sku = "N/A";
        }

        return InventoryResponse.builder()
                .id(inventory.getId())
                .productId(id)
                .productName(name)
                .productSku(sku)
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
