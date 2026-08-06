package hu.mes.backend.models.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Getter
public enum WorkOrderPriority {
    LOW("Alacsony"),
    MEDIUM("Közepes"),
    HIGH("Magas"),
    URGENT("Sürgős");

    private final String priority;
}
