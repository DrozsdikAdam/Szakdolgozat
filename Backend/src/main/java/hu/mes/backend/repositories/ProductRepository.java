package hu.mes.backend.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import hu.mes.backend.models.Product;
import org.springframework.data.repository.query.Param;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {

    Optional<Product> findBySku(String sku);

    boolean existsBySku(String sku);

    List<Product> findByActiveTrue();

    Page<Product> findByActiveTrue(Pageable pageable);

    Page<Product> findAll(Pageable pageable);

    @Query(value = "SELECT * FROM products p WHERE p.deleted = true", nativeQuery = true)
    List<Product> findDeletedProducts();

    @Query(value = "SELECT * FROM products p WHERE p.deleted = true AND p.id = :id", nativeQuery = true)
    Optional<Product> findDeletedById(@Param("id") UUID id);

    List<Product> findByActiveFalse();

}
