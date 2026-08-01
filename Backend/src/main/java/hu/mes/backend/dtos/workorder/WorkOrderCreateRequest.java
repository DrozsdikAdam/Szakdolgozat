package hu.mes.backend.dtos.workorder;

import java.math.BigDecimal;
import java.util.UUID;

import hu.mes.backend.models.enums.WorkOrderPriority;
import hu.mes.backend.models.enums.WorkOrderStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class WorkOrderCreateRequest {
    @NotNull(message = "A termék ID nem lehet null!")
    private UUID productId;
    @NotNull(message = "A célmennyiség nem lehet null!")
    @PositiveOrZero(message = "A célmennyiségnek pozitívnak kell lennie!")
    private BigDecimal targetQuantity;
    @NotNull(message = "Az állapot nem lehet null!")
    private WorkOrderStatus status;
    @NotNull(message = "A prioritás nem lehet null!")
    private WorkOrderPriority priority;
}
