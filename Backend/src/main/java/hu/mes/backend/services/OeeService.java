package hu.mes.backend.services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.cache.annotation.CacheConfig;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import hu.mes.backend.dtos.telemetry.OeeResponse;
import hu.mes.backend.models.Machine;
import hu.mes.backend.models.MachineTelemetry;
import hu.mes.backend.models.enums.MachineStatus;
import hu.mes.backend.repositories.MachineRepository;
import hu.mes.backend.repositories.MachineTelemetryRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@CacheConfig(cacheNames = "telemetry")
@Slf4j
public class OeeService {

	private final MachineRepository machineRepository;
	private final MachineTelemetryRepository telemetryRepository;

	@Cacheable
	@CircuitBreaker(name = "oeeService", fallbackMethod = "calculateOeeFallback")
	public OeeResponse calculateMachineOee(UUID machineId, LocalDateTime start, LocalDateTime end) {
		List<MachineTelemetry> telemetries = telemetryRepository.findByMachineIdAndTimestampBetween(machineId,
				start,
				end);

		Machine machine = machineRepository.findById(machineId)
				.orElseThrow(() -> new RuntimeException("Machine not found: " + machineId));

		if (telemetries.isEmpty()) {
			return OeeResponse.builder()
					.availabilityPercentage(0.0)
					.performancePercentage(0.0)
					.qualityPercentage(0.0)
					.oeePercentage(0.0)
					.totalProducedCount(0)
					.totalScrapCount(0)
					.uptimeMinutes(0L)
					.downtimeMinutes(0L)
					.build();
		}

		Long totalSamples = (long) telemetries.size();
		Long runningSamples = telemetries.stream().filter(t -> t.getStatus() == MachineStatus.RUNNING).count();
		Long downtimeSamples = totalSamples - runningSamples;

		Long uptimeMinutes = (runningSamples * 5) / 60;
		Long downtimeMinutes = (downtimeSamples * 5) / 60;
		Double availabilityPercentage = (runningSamples.doubleValue() / totalSamples.doubleValue()) * 100.0;

		Long totalScrap = telemetries.stream()
				.mapToLong(t -> t.getScrapCount() != null ? t.getScrapCount() : 0)
				.sum();
		Long totalProduced = telemetries.stream()
				.mapToLong(t -> t.getProducedCount() != null ? t.getProducedCount() : 0)
				.sum();

		Long goodCount = totalProduced - totalScrap;
		Double qualityPercentage = totalProduced > 0
				? (goodCount.doubleValue() / totalProduced.doubleValue()) * 100.0
				: 100.0;

		Double potential = (runningSamples * 5) / machine.getIdealCycleTimeSeconds();
		Double performancePercentage = potential > 0
				? (totalProduced.doubleValue() / potential.doubleValue()) * 100.0
				: 100.0;

		Double oeePercentage = (availabilityPercentage / 100.0)
				* (performancePercentage / 100.0)
				* (qualityPercentage / 100.0)
				* 100.0;

		performancePercentage = Math.min(100.0, performancePercentage);
		oeePercentage = Math.min(100.0, oeePercentage);

		return OeeResponse.builder()
				.availabilityPercentage(availabilityPercentage)
				.performancePercentage(performancePercentage)
				.qualityPercentage(qualityPercentage)
				.oeePercentage(oeePercentage)
				.totalProducedCount(totalProduced.intValue())
				.totalScrapCount(totalScrap.intValue())
				.uptimeMinutes(uptimeMinutes)
				.downtimeMinutes(downtimeMinutes)
				.build();
	}

	public OeeResponse calculateOeeFallback(UUID id, LocalDateTime start, LocalDateTime end, Throwable throwable) {
		log.warn("Hiba a {} gépi OEE számításakor: {}", id, throwable.getMessage());

		return OeeResponse.builder()
				.availabilityPercentage(0.0)
				.performancePercentage(0.0)
				.qualityPercentage(0.0)
				.oeePercentage(0.0)
				.totalProducedCount(0)
				.totalScrapCount(0)
				.uptimeMinutes(0L)
				.downtimeMinutes(0L)
				.build();
	}
}
