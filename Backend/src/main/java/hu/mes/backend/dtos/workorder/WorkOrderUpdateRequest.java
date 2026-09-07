package hu.mes.backend.dtos.workorder;

import java.math.BigDecimal;
import java.util.UUID;

import hu.mes.backend.models.enums.WorkOrderPriority;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class WorkOrderUpdateRequest {
    @Positive
    @NotNull
    private BigDecimal targetQuantity;
    @NotNull
    private WorkOrderPriority priority;
    @NotNull
    @Size(min = 1, max = 100)
    private String customerName;
    private UUID assignedUserId;
}
