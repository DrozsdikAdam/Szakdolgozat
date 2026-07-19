package hu.mes.backend.services;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;

import hu.mes.backend.dtos.bom.BOMItemRequest;
import hu.mes.backend.dtos.bom.BOMResponse;
import hu.mes.backend.dtos.bom.BOMTreeNode;
import hu.mes.backend.mappers.BOMMapper;
import hu.mes.backend.models.BOMItem;
import hu.mes.backend.models.Product;
import hu.mes.backend.repositories.BOMItemRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BOMService {
    private final BOMItemRepository bomRepository;
    private final ProductService productService;
    private final BOMMapper bomMapper;

    @Transactional
    public BOMResponse addComponentToBOM(BOMItemRequest request) {
        Product parent = productService.getProductById(request.getParentProductId());
        Product component = productService.getProductById(request.getComponentProductId());

        if (parent.getId().equals(component.getId()))
            throw new IllegalArgumentException("A szülő és a komponens nem lehet ugyanaz.");

        Optional<BOMItem> item = bomRepository.findByParentProductIdAndComponentProductId(
                parent.getId(),
                component.getId());

        if (item.isPresent())
            throw new IllegalArgumentException("Ez a komponens már hozzá van adva a listához!");

        BOMItem bomItem = BOMItem.builder()
                .parentProduct(parent)
                .componentProduct(component)
                .quantity(request.getQuantity())
                .active(true)
                .build();
        bomRepository.save(bomItem);

        return bomMapper.convertToResponse(bomItem);
    }

    public BOMTreeNode getBOMTree(UUID parentProductId, BigDecimal multiplier) {
        if (multiplier == null)
            multiplier = BigDecimal.ONE;

        Product product = productService.getProductById(parentProductId);
        if (product == null)
            return null;

        BOMTreeNode node = new BOMTreeNode();
        node.setProductId(product.getId());
        node.setProductName(product.getName());
        node.setProductSku(product.getSku());
        node.setUnit(product.getUnit());
        node.setQuantity(multiplier);

        List<BOMTreeNode> children = new ArrayList<>();
        for (BOMItem item : bomRepository.findByParentProductId(parentProductId))
            if (item.getActive())
                children.add(getBOMTree(
                        item.getComponentProduct().getId(),
                        multiplier.multiply(item.getQuantity())));

        node.setChildren(children);
        return node;
    }
}
