package hu.mes.backend.mappers;

import java.util.List;

import org.springframework.stereotype.Component;

import hu.mes.backend.dtos.workorder.WorkOrderResponse;
import hu.mes.backend.models.WorkOrder;

@Component
public class WorkOrderMapper {

    public WorkOrderResponse convertToResponse(WorkOrder order) {
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
