package hu.mes.backend.models.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Getter
public enum MaintenanceStatus {
    SCHEDULED("scheduled"),
    IN_PROGRESS("inProgress"),
    COMPLETED("completed"),
    CANCELLED("cancelled");

    private final String status;
}
