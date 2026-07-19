package hu.mes.backend.mappers;

import java.util.List;

import org.springframework.stereotype.Component;

import hu.mes.backend.dtos.product.ProductResponse;
import hu.mes.backend.models.Product;

@Component
public class ProductMapper {
    public ProductResponse convertToResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .sku(product.getSku())
                .description(product.getDescription())
                .unit(product.getUnit())
                .active(product.getActive())
                .createdAt(product.getCreatedAt())
                .build();
    }

    public List<ProductResponse> convertToResponses(List<Product> products) {
        return products.stream().map(this::convertToResponse).toList();
    }

}
