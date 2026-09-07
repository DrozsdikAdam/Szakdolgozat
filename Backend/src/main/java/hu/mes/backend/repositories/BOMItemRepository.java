package hu.mes.backend.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import hu.mes.backend.models.BOMItem;
import hu.mes.backend.models.Product;

@Repository
public interface BOMItemRepository extends JpaRepository<BOMItem, UUID> {

    List<BOMItem> findByParentProductId(UUID parentProductId);

    List<BOMItem> findByComponentProduct(Product componentProduct);

    Optional<BOMItem> findByParentProductIdAndComponentProductId(UUID parentProductId, UUID componentProductId);

}
