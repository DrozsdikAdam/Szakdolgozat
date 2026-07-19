package hu.mes.backend.mappers;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

import hu.mes.backend.dtos.bom.BOMResponse;
import hu.mes.backend.models.BOMItem;
import hu.mes.backend.models.Product;

@Component
public class BOMMapper {

    public BOMResponse convertToResponse(BOMItem item) {
        Product componentProduct = item.getComponentProduct();
        return BOMResponse.builder()
                .id(item.getId())
                .parentProductId(item.getParentProduct().getId())
                .componentProductId(componentProduct.getId())
                .componentProductName(componentProduct.getName())
                .componentProductSku(componentProduct.getSku())
                .quantity(item.getQuantity())
                .active(item.getActive())
                .build();
    }

    public List<BOMResponse> convertToResponseList(List<BOMItem> items) {
        if (items == null)
            return new ArrayList<>();

        return items.stream().map(this::convertToResponse).toList();
    }

}
