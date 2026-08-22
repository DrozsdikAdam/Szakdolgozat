package hu.mes.backend.dtos.telemetry;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OeeResponse {

    private Double availabilityPercentage;
    private Double performancePercentage;
    private Double qualityPercentage;
    private Double oeePercentage;

    private Integer totalProducedCount;
    private Integer totalScrapCount;

    private Long uptimeMinutes;
    private Long downTimeMinutes;

}