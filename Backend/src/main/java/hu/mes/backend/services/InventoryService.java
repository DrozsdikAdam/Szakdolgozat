package hu.mes.backend.services;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import hu.mes.backend.repositories.InventoryRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import hu.mes.backend.dtos.common.PagedResponse;
import hu.mes.backend.dtos.inventory.InventoryResponse;
import hu.mes.backend.dtos.inventory.InventoryUpdateRequest;
import hu.mes.backend.mappers.InventoryMapper;
import hu.mes.backend.models.Inventory;
import hu.mes.backend.models.Product;
import hu.mes.backend.models.enums.AuditAction;
import hu.mes.backend.models.enums.AuditEntityType;
import hu.mes.backend.models.enums.NotificationType;

@Service
@RequiredArgsConstructor
@Transactional
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final InventoryMapper inventoryMapper;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

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
        checkLowStockAndNotify(inventory);
        auditLogService.log("WAREHOUSE", null, AuditAction.STOCK_ADJUSTMENT, AuditEntityType.INVENTORY,
                inventory.getProduct().getSku(), "Készletkorrekció: " + request.getAmount() + " db. Új egyenleg: "
                        + newQuantity + " db (" + inventory.getProduct().getName() + ")");
        return inventoryMapper.convertToResponse(inventoryRepository.save(inventory));
    }

    public InventoryResponse reserveStock(InventoryUpdateRequest request) {
        Inventory inventory = inventoryRepository.findByProductId(request.getProductId())
                .orElseThrow(() -> new EntityNotFoundException("A termékhez nem tartozik nyilvántartás!"));

        BigDecimal reserved = inventory.getReservedQuantity() != null ? inventory.getReservedQuantity()
                : BigDecimal.ZERO;

        BigDecimal quantity = inventory.getQuantity() != null ? inventory.getQuantity() : BigDecimal.ZERO;

        BigDecimal freeStock = quantity.subtract(reserved);

        if (freeStock.compareTo(request.getAmount()) < 0)
            throw new IllegalArgumentException("Nincs elegendő lefoglalható készlet!");

        inventory.setReservedQuantity(reserved.add(request.getAmount()));
        inventory.setUpdatedAt(LocalDateTime.now());
        checkLowStockAndNotify(inventory);
        return inventoryMapper.convertToResponse(inventoryRepository.save(inventory));

    }

    public InventoryResponse consumeReservedStock(InventoryUpdateRequest request) {
        Inventory inventory = inventoryRepository.findByProductId(request.getProductId())
                .orElseThrow(() -> new EntityNotFoundException("A termékhez nem tartozik nyilvántartás!"));

        BigDecimal reserved = inventory.getReservedQuantity() != null ? inventory.getReservedQuantity()
                : BigDecimal.ZERO;

        BigDecimal quantity = inventory.getQuantity() != null ? inventory.getQuantity() : BigDecimal.ZERO;

        if (reserved.compareTo(request.getAmount()) < 0)
            throw new IllegalArgumentException("Nincs elegendő lefoglalt készlet!");

        inventory.setQuantity(quantity.subtract(request.getAmount()));
        inventory.setReservedQuantity(reserved.subtract(request.getAmount()));
        inventory.setUpdatedAt(LocalDateTime.now());
        checkLowStockAndNotify(inventory);
        return inventoryMapper.convertToResponse(inventoryRepository.save(inventory));
    }

    public InventoryResponse releaseReservedStock(InventoryUpdateRequest request) {
        Inventory inventory = inventoryRepository.findByProductId(request.getProductId())
                .orElseThrow(() -> new EntityNotFoundException("A termékhez nem tartozik nyilvántartás!"));

        BigDecimal reserved = inventory.getReservedQuantity() != null ? inventory.getReservedQuantity()
                : BigDecimal.ZERO;

        if (reserved.compareTo(request.getAmount()) < 0)
            throw new IllegalArgumentException("Nincs elegendő lefoglalt készlet!");

        inventory.setReservedQuantity(reserved.subtract(request.getAmount()));
        inventory.setUpdatedAt(LocalDateTime.now());
        return inventoryMapper.convertToResponse(inventoryRepository.save(inventory));
    }

    public PagedResponse<InventoryResponse> getAllInventories(Pageable pageable) {
        Page<Inventory> page = inventoryRepository.findAll(pageable);
        return PagedResponse.of(page, inventoryMapper.convertToResponses(page.getContent()));
    }

    public List<InventoryResponse> getAllInventories() {
        return inventoryMapper.convertToResponses(inventoryRepository.findAll());
    }

    private void checkLowStockAndNotify(Inventory inventory) {
        BigDecimal reserved = inventory.getReservedQuantity() != null ? inventory.getReservedQuantity()
                : BigDecimal.ZERO;
        BigDecimal quantity = inventory.getQuantity() != null ? inventory.getQuantity() : BigDecimal.ZERO;
        BigDecimal available = quantity.subtract(reserved);
        if (available.compareTo(BigDecimal.valueOf(10)) <= 0) {
            notificationService.send(
                    "⚠️ Alacsony készlet: " + inventory.getProduct().getName(),
                    "A szabad raktárkészlet " + available + " db-ra csökkent!",
                    NotificationType.WARNING,
                    "/inventory");
        }
    }

}
