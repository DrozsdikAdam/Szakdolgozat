package hu.mes.backend.models.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Getter
public enum WorkOrderStatus {
    PLANNED("Tervezett"),
    PREPARED("Előkészítve"),
    IN_PROGRESS("Gyártásban"),
    QUALITY_CHECK("Minőségellenőrzés"),
    COMPLETED("Teljesítve"),
    CANCELLED("Visszavont");

    private final String status;
}
