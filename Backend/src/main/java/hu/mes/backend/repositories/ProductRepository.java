package hu.mes.backend.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import hu.mes.backend.models.Product;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {

    Optional<Product> findBySku(String sku);

    boolean existsBySku(String sku);

    List<Product> findByActiveTrueAndDeletedFalse();

    Page<Product> findByActiveTrueAndDeletedFalse(Pageable pageable);

    List<Product> findByActiveFalseAndDeletedFalse();

    List<Product> findByDeletedTrue();

    Optional<Product> findByIdAndDeletedTrue(UUID id);

    Optional<Product> findByIdAndDeletedFalse(UUID id);
}
