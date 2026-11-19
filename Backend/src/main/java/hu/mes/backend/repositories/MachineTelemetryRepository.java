package hu.mes.backend.repositories;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import hu.mes.backend.dtos.telemetry.OeeAggregationProjection;
import hu.mes.backend.models.MachineTelemetry;

import org.springframework.data.jpa.repository.Modifying;

@Repository
public interface MachineTelemetryRepository extends JpaRepository<MachineTelemetry, UUID> {

    Optional<MachineTelemetry> findTopByMachineIdOrderByTimestampDesc(UUID machineId);

    List<MachineTelemetry> findByMachineIdAndTimestampBetween(UUID machineId,
            LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(t) as totalSamples, " +
           "SUM(CASE WHEN t.status = hu.mes.backend.models.enums.MachineStatus.RUNNING THEN 1L ELSE 0L END) as runningSamples, " +
           "COALESCE(SUM(t.producedCount), 0L) as totalProduced, " +
           "COALESCE(SUM(t.scrapCount), 0L) as totalScrap " +
           "FROM MachineTelemetry t " +
           "WHERE t.machine.id = :machineId AND t.timestamp BETWEEN :start AND :end")
    OeeAggregationProjection calculateOeeAggregation(@Param("machineId") UUID machineId,
                                                    @Param("start") LocalDateTime start,
                                                    @Param("end") LocalDateTime end);

    @Modifying
    @Query("DELETE FROM MachineTelemetry t WHERE t.timestamp < :cutoff")
    int deleteByTimestampBefore(@Param("cutoff") LocalDateTime cutoff);

    List<MachineTelemetry> findByTimestampBetween(LocalDateTime start, LocalDateTime end);

    List<MachineTelemetry> findTop50ByMachineIdOrderByTimestampDesc(UUID machineId);

}
