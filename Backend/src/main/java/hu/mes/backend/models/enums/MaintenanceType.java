package hu.mes.backend.models.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Getter
public enum MaintenanceType {
    PREVENTIVE("preventive"),
    CORRECTIVE("corrective");

    private final String type;
}
