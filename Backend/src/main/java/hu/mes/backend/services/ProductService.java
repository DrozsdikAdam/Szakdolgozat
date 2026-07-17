package hu.mes.backend.services;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import hu.mes.backend.models.Product;
import hu.mes.backend.repositories.ProductRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    @Transactional
    public Product createProduct(Product product) {
        if (product == null || productRepository.existsBySku(product.getSku())) {
            throw new IllegalArgumentException("A termék nem létezik vagy a SKU már létezik.");
        }
        return productRepository.save(product);
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public List<Product> getActiveProducts() {
        return productRepository.findByActiveTrue();
    }

    public Product getProductById(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("A keresett termék nem található!"));
    }

    public void deleteProduct(UUID id) {
        Product product = getProductById(id);
        product.setDeleted(true);
        product.setActive(false);
        productRepository.save(product);
    }

    @Transactional
    public void updateProduct(UUID id, Product product) {
        Product existingProduct = getProductById(id);

        if (!product.getSku().equals(existingProduct.getSku())
                && productRepository.existsBySku(product.getSku())) {
            throw new IllegalArgumentException("A termék SKU-ja már létezik!");
        }

        existingProduct.setName(product.getName());
        existingProduct.setDescription(product.getDescription());
        existingProduct.setSku(product.getSku());
        existingProduct.setUnit(product.getUnit());
        existingProduct.setActive(product.getActive());

        productRepository.save(existingProduct);
    }

    public List<Product> getDeletedProducts() {
        return productRepository.findDeletedProducts();
    }

    public List<Product> getInactiveProducts() {
        return productRepository.findByActiveFalse();
    }

    @Transactional
    public void deactivateProduct(UUID id) {
        Product product = getProductById(id);
        product.setActive(false);
        productRepository.save(product);
    }

    @Transactional
    public void activateProduct(UUID id) {
        Product product = getProductById(id);
        product.setActive(true);
        productRepository.save(product);
    }

    @Transactional
    public void restoreProduct(UUID id) {
        Product product = productRepository.findDeletedById(id)
                .orElseThrow(() -> new EntityNotFoundException("A keresett termék nem található!"));
        product.setDeleted(false);
        product.setActive(true);
        productRepository.save(product);
    }

}
