package hu.mes.backend.dtos.workorder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import hu.mes.backend.models.enums.WorkOrderPriority;
import hu.mes.backend.models.enums.WorkOrderStatus;
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
public class WorkOrderResponse {
    private UUID id;
    private String orderNumber;

    private UUID productId;
    private String productName;
    private String productSku;

    private BigDecimal targetQuantity;
    private BigDecimal producedQuantity;
    private BigDecimal scrapQuantity;

    private WorkOrderStatus status;
    private WorkOrderPriority priority;
    private String customerName;
    private UUID assignedUserId;
    private String assignedUserName;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
}
