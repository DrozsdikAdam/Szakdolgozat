package hu.mes.backend.dtos.workorder;

import java.math.BigDecimal;

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
public class WorkOrderStatusUpdateRequest {
    @NotNull(message = "Az állapot nem lehet null!")
    private WorkOrderStatus status;
    @NotNull(message = "A gyártott mennyiség nem lehet null!")
    @PositiveOrZero(message = "A gyártott mennyiségnek pozitívnak vagy nullának kell lennie!")
    private BigDecimal producedQuantity;
    @NotNull(message = "A hulladék mennyiség nem lehet null!")
    @PositiveOrZero(message = "A hulladék mennyiségnek pozitívnak vagy nullának kell lennie!")
    private BigDecimal scrapQuantity;
}
