package hu.mes.backend.mappers;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.stereotype.Component;

import hu.mes.backend.dtos.workorder.WorkOrderResponse;
import hu.mes.backend.models.WorkOrder;

@Component
public class WorkOrderMapper {

    public WorkOrderResponse convertToResponse(WorkOrder order) {

        BigDecimal produced = order.getProducedQuantity() != null ? order.getProducedQuantity() : BigDecimal.ZERO;
        BigDecimal scrap = order.getScrapQuantity() != null ? order.getScrapQuantity() : BigDecimal.ZERO;
        BigDecimal good = produced.subtract(scrap);
        if (good.compareTo(BigDecimal.ZERO) < 0)
            good = BigDecimal.ZERO;
        Double progress = 0.0;
        if (order.getTargetQuantity() != null && order.getTargetQuantity().compareTo(BigDecimal.ZERO) > 0) {
            progress = Math.min(100.0, (good.doubleValue() / order.getTargetQuantity().doubleValue()) * 100.0);
        }

        return WorkOrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())

                .productId(order.getProduct().getId())
                .productName(order.getProduct().getName())
                .productSku(order.getProduct().getSku())

                .targetQuantity(order.getTargetQuantity())
                .producedQuantity(order.getProducedQuantity())
                .scrapQuantity(order.getScrapQuantity())

                .status(order.getStatus())
                .priority(order.getPriority())

                .customerName(order.getCustomerName())
                .assignedUserId(order.getAssignedUser() != null ? order.getAssignedUser().getId() : null)
                .assignedUserName(order.getAssignedUser() != null ? order.getAssignedUser().getName() : null)

                .goodQuantity(good)
                .progressPercentage(progress)

                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .startDate(order.getStartDate())
                .endDate(order.getEndDate())
                .build();
    }

    public List<WorkOrderResponse> convertToResponses(List<WorkOrder> list) {
        return list
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

}
