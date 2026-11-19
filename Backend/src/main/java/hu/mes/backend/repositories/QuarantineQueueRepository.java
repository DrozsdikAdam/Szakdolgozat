package hu.mes.backend.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import hu.mes.backend.models.QuarantineQueue;
import hu.mes.backend.models.enums.QuarantineStatus;

@Repository
public interface QuarantineQueueRepository extends JpaRepository<QuarantineQueue, UUID> {
    Boolean existsByOperationId(String operationId);

    Optional<QuarantineQueue> findByOperationId(String operationId);

    List<QuarantineQueue> findByStatusOrderByCreatedAtDesc(QuarantineStatus status);

    Page<QuarantineQueue> findByStatusOrderByCreatedAtDesc(QuarantineStatus status, Pageable pageable);

    List<QuarantineQueue> findByEntityNameAndEntityIdOrderByCreatedAtDesc(String entityName, String entityId);

    Long countByStatus(QuarantineStatus status);
}
