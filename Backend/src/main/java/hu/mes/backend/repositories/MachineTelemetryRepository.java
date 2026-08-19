package hu.mes.backend.repositories;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import hu.mes.backend.models.MachineTelemetry;

@Repository
public interface MachineTelemetryRepository extends JpaRepository<MachineTelemetry, UUID> {

    Optional<MachineTelemetry> findTopByMachineIdOrderByTimestampDesc(UUID machineId);

    List<MachineTelemetry> findByMachineIdAndTimestampBetween(UUID machineId,
            LocalDateTime start, LocalDateTime end);

    List<MachineTelemetry> findByTimestampBetween(LocalDateTime start, LocalDateTime end);

    List<MachineTelemetry> findTop50ByMachineIdOrderByTimestampDesc(UUID machineId);

}
