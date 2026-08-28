package hu.mes.backend.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import hu.mes.backend.models.AuditLog;
import hu.mes.backend.models.enums.AuditAction;
import hu.mes.backend.models.enums.AuditEntityType;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    Page<AuditLog> findByUsernameOrderByTimestampDesc(String username, Pageable pageable);

    Page<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);

    Page<AuditLog> findAllByEntityTypeOrderByTimestampDesc(AuditEntityType entityType, Pageable pageable);

    Page<AuditLog> findAllByActionOrderByTimestampDesc(AuditAction action, Pageable pageable);

    Page<AuditLog> findByEntityTypeAndActionOrderByTimestampDesc(AuditEntityType entityType, AuditAction action,
            Pageable pageable);

}
