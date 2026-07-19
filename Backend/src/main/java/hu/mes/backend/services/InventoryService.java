package hu.mes.backend.services;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;

import hu.mes.backend.repositories.InventoryRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import hu.mes.backend.dtos.InventoryResponse;
import hu.mes.backend.dtos.InventoryUpdateRequest;
import hu.mes.backend.mappers.InventoryMapper;
import hu.mes.backend.models.Inventory;
import hu.mes.backend.models.Product;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final InventoryMapper inventoryMapper;

    @Transactional
    public void initializeInventory(Product product) {
        if (product == null)
            throw new IllegalArgumentException("A termék nem létezik!");

        Optional<Inventory> inventory = inventoryRepository.findByProduct(product);

        if (inventory.isPresent())
            return;

        Inventory newInventory = new Inventory();
        newInventory.setProduct(product);
        newInventory.setQuantity(BigDecimal.ZERO);
        newInventory.setReservedQuantity(BigDecimal.ZERO);
        newInventory.setUpdatedAt(LocalDateTime.now());
        inventoryRepository.save(newInventory);
    }

    public InventoryResponse getInventoryByProductId(UUID id) {
        Inventory inventory = inventoryRepository.findByProductId(id)
                .orElseThrow(() -> new EntityNotFoundException("A termékhez nem tartozik nyilvántartás!"));
        return inventoryMapper.convertToResponse(inventory);
    }

    @Transactional
    public InventoryResponse adjustStock(InventoryUpdateRequest request) {
        Inventory inventory = inventoryRepository.findByProductId(request.getProductId())
                .orElseThrow(() -> new EntityNotFoundException("A termékhez nem tartozik nyilvántartás!"));

        if (request.getLocation() != null && !request.getLocation().isEmpty())
            inventory.setLocation(request.getLocation());

        BigDecimal newQuantity = inventory.getQuantity().add(request.getAmount());
        if (newQuantity.compareTo(BigDecimal.ZERO) < 0)
            throw new IllegalArgumentException("Nincs elegendő készlet!");

        inventory.setQuantity(newQuantity);
        inventory.setUpdatedAt(LocalDateTime.now());
        return inventoryMapper.convertToResponse(inventoryRepository.save(inventory));
    }

    @Transactional
    public InventoryResponse reserveStock(InventoryUpdateRequest request) {
        Inventory inventory = inventoryRepository.findByProductId(request.getProductId())
                .orElseThrow(() -> new EntityNotFoundException("A termékhez nem tartozik nyilvántartás!"));
        BigDecimal reserved = inventory.getReservedQuantity();
        BigDecimal freeStock = inventory.getQuantity().subtract(reserved);

        if (freeStock.compareTo(request.getAmount()) < 0)
            throw new IllegalArgumentException("Nincs elegendő lefoglalható készlet!");

        inventory.setReservedQuantity(reserved.add(request.getAmount()));
        inventory.setUpdatedAt(LocalDateTime.now());
        return inventoryMapper.convertToResponse(inventoryRepository.save(inventory));
    }

    @Transactional
    public InventoryResponse consumeReservedStock(InventoryUpdateRequest request) {
        Inventory inventory = inventoryRepository.findByProductId(request.getProductId())
                .orElseThrow(() -> new EntityNotFoundException("A termékhez nem tartozik nyilvántartás!"));
        BigDecimal reserved = inventory.getReservedQuantity();

        if (reserved.compareTo(request.getAmount()) < 0)
            throw new IllegalArgumentException("Nincs elegendő lefoglalt készlet!");

        inventory.setQuantity(inventory.getQuantity().subtract(request.getAmount()));
        inventory.setReservedQuantity(reserved.subtract(request.getAmount()));
        inventory.setUpdatedAt(LocalDateTime.now());
        return inventoryMapper.convertToResponse(inventoryRepository.save(inventory));
    }

    @Transactional
    public InventoryResponse releaseReservedStock(InventoryUpdateRequest request) {
        Inventory inventory = inventoryRepository.findByProductId(request.getProductId())
                .orElseThrow(() -> new EntityNotFoundException("A termékhez nem tartozik nyilvántartás!"));
        BigDecimal reserved = inventory.getReservedQuantity();

        if (reserved.compareTo(request.getAmount()) < 0)
            throw new IllegalArgumentException("Nincs elegendő lefoglalt készlet!");

        inventory.setReservedQuantity(reserved.subtract(request.getAmount()));
        inventory.setUpdatedAt(LocalDateTime.now());
        return inventoryMapper.convertToResponse(inventoryRepository.save(inventory));
    }

    public List<InventoryResponse> getAllInventories() {
        return inventoryMapper.convertToResponses(inventoryRepository.findAll());
    }
}
