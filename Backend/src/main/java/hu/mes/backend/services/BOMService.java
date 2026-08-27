package hu.mes.backend.services;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;

import hu.mes.backend.dtos.bom.BOMItemRequest;
import hu.mes.backend.dtos.bom.BOMResponse;
import hu.mes.backend.dtos.bom.BOMTreeNode;
import hu.mes.backend.mappers.BOMMapper;
import hu.mes.backend.models.BOMItem;
import hu.mes.backend.models.Product;
import hu.mes.backend.repositories.BOMItemRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class BOMService {
    private final BOMItemRepository bomRepository;
    private final ProductService productService;
    private final BOMMapper bomMapper;

    public BOMResponse addComponentToBOM(BOMItemRequest request) {
        Product parent = productService.getProductEntityById(request.getParentProductId());
        Product component = productService.getProductEntityById(request.getComponentProductId());

        if (parent.getId().equals(component.getId()))
            throw new IllegalArgumentException("A szülő és a komponens nem lehet ugyanaz.");

        Optional<BOMItem> item = bomRepository.findByParentProductIdAndComponentProductId(
                parent.getId(),
                component.getId());

        if (item.isPresent())
            throw new IllegalArgumentException("Ez a komponens már hozzá van adva a listához!");

        if (isComponentSubtree(component.getId(), parent.getId()))
            throw new IllegalArgumentException("Ciklikus függőség!");

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

        Product product = productService.getProductEntityById(parentProductId);
        getBOMTree(parentProductId, multiplier, new HashSet<>());

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

    private void getBOMTree(UUID parentProductId, BigDecimal multiplier, Set<UUID> visitedProducts) {
        visitedProducts.add(parentProductId);
        List<BOMItem> items = bomRepository.findByParentProductId(parentProductId);
        for (BOMItem item : items) {
            if (item.getActive()) {
                if (visitedProducts.contains(item.getComponentProduct().getId())) {
                    throw new IllegalArgumentException(
                            "Ciklikus függőség: A kiválasztott alkatrész már tartalmazza a szülő terméket a saját darabjegyzékében!");
                }
                getBOMTree(item.getComponentProduct().getId(), multiplier.multiply(item.getQuantity()),
                        visitedProducts);
            }
        }
        visitedProducts.remove(parentProductId);
    }

    private boolean isComponentSubtree(UUID currentParentId, UUID targetComponentId) {
        if (currentParentId.equals(targetComponentId))
            return true;

        for (BOMItem item : bomRepository.findByParentProductId(currentParentId))
            if (item.getActive()
                    && isComponentSubtree(item.getComponentProduct().getId(), targetComponentId))
                return true;

        return false;
    }
}
