package hu.mes.backend.services;

import java.util.List;
import java.util.UUID;

import org.springframework.cache.annotation.CacheConfig;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import hu.mes.backend.dtos.common.PagedResponse;
import hu.mes.backend.dtos.product.ProductCreateRequest;
import hu.mes.backend.dtos.product.ProductResponse;
import hu.mes.backend.dtos.product.ProductUpdateRequest;
import hu.mes.backend.mappers.ProductMapper;
import hu.mes.backend.models.Product;
import hu.mes.backend.models.enums.AuditAction;
import hu.mes.backend.models.enums.AuditEntityType;
import hu.mes.backend.repositories.ProductRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@CacheConfig(cacheNames = "products")
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;
    private final InventoryService inventoryService;
    private final AuditLogService auditLogService;

    @CacheEvict(allEntries = true)
    @Transactional
    public ProductResponse createProduct(ProductCreateRequest request) {
        if (request == null || productRepository.existsBySku(request.getSku()))
            throw new IllegalArgumentException("A termék nem létezik vagy a SKU már létezik.");

        Product product = Product.builder()
                .name(request.getName())
                .sku(request.getSku())
                .description(request.getDescription())
                .unit(request.getUnit())
                .active(true)
                .deleted(false)
                .build();

        Product savedProduct = productRepository.save(product);
        inventoryService.initializeInventory(savedProduct);

        auditLogService.log(AuditAction.CREATE, AuditEntityType.PRODUCT, savedProduct.getSku(),
                "Új termék létrehozva: " + savedProduct.getName() + " (" + savedProduct.getSku() + ")");

        return productMapper.convertToResponse(savedProduct);
    }

    public PagedResponse<ProductResponse> getAllProducts(Pageable pageable) {
        Page<Product> page = productRepository.findByActiveTrueAndDeletedFalse(pageable);
        return PagedResponse.of(page, productMapper.convertToResponses(page.getContent()));
    }

    @Cacheable(key = "'active'")
    public List<ProductResponse> getActiveProducts() {
        return productMapper.convertToResponses(productRepository.findByActiveTrueAndDeletedFalse());
    }

    public Product getProductEntityById(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("A keresett termék nem található!"));
    }

    @Cacheable(key = "#id")
    public ProductResponse getProductById(UUID id) {
        return productMapper.convertToResponse(getProductEntityById(id));
    }

    @CacheEvict(allEntries = true)
    @Transactional
    public void deleteProduct(UUID id) {
        Product product = getProductEntityById(id);
        product.setDeleted(true);
        product.setActive(false);
        productRepository.save(product);

        auditLogService.log(AuditAction.DELETE, AuditEntityType.PRODUCT, product.getSku(),
                "Termék törölve (lomtárba helyezve): " + product.getName());
    }

    @CacheEvict(allEntries = true)
    @Transactional
    public ProductResponse updateProduct(UUID id, ProductUpdateRequest request) {
        Product existingProduct = getProductEntityById(id);

        if (!request.getSku().equals(existingProduct.getSku())
                && productRepository.existsBySku(request.getSku()))
            throw new IllegalArgumentException("A termék SKU-ja már létezik!");

        existingProduct.setName(request.getName());
        existingProduct.setDescription(request.getDescription());
        existingProduct.setSku(request.getSku());
        existingProduct.setUnit(request.getUnit());

        Product updated = productRepository.save(existingProduct);
        auditLogService.log(AuditAction.UPDATE, AuditEntityType.PRODUCT, updated.getSku(),
                "Termék módosítva: " + updated.getName() + " (" + updated.getSku() + ")");

        return productMapper.convertToResponse(updated);
    }

    public List<ProductResponse> getDeletedProducts() {
        return productMapper.convertToResponses(productRepository.findByDeletedTrue());
    }

    public List<ProductResponse> getInactiveProducts() {
        return productMapper.convertToResponses(productRepository.findByActiveFalseAndDeletedFalse());
    }

    @CacheEvict(allEntries = true)
    @Transactional
    public void updateProductActiveStatus(UUID id, Boolean active, String actionName) {
        Product product = getProductEntityById(id);
        product.setActive(active);
        productRepository.save(product);

        auditLogService.log(AuditAction.STATUS_CHANGE, AuditEntityType.PRODUCT, product.getSku(),
                product.getName() + " " + actionName);
    }

    @CacheEvict(allEntries = true)
    @Transactional
    public void restoreProduct(UUID id) {
        Product product = productRepository.findByIdAndDeletedTrue(id)
                .orElseThrow(() -> new EntityNotFoundException("A keresett termék nem található!"));
        product.setDeleted(false);
        product.setActive(true);
        productRepository.save(product);

        auditLogService.log(AuditAction.UPDATE, AuditEntityType.PRODUCT, product.getSku(),
                "Termék visszaállítva a lomtárból: " + product.getName());
    }
}
