package hu.mes.backend.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import hu.mes.backend.models.AuditLog;
import hu.mes.backend.models.enums.AuditEntityType;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    List<AuditLog> findTop100ByOrderByTimestampDesc();

    List<AuditLog> findByEntityTypeOrderByTimestampDesc(AuditEntityType entityType);

    List<AuditLog> findByUsernameOrderByTimestampDesc(String username);

}
