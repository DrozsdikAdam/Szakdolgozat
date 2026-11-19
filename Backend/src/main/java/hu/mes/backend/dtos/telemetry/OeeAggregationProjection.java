package hu.mes.backend.dtos.telemetry;

public interface OeeAggregationProjection {
    Long getTotalSamples();
    Long getRunningSamples();
    Long getTotalProduced();
    Long getTotalScrap();
}
