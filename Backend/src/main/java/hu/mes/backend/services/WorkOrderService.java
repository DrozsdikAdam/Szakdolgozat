package hu.mes.backend.services;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import hu.mes.backend.dtos.inventory.InventoryUpdateRequest;
import hu.mes.backend.dtos.workorder.WorkOrderCreateRequest;
import hu.mes.backend.dtos.workorder.WorkOrderResponse;
import hu.mes.backend.dtos.workorder.WorkOrderStatusUpdateRequest;
import hu.mes.backend.mappers.WorkOrderMapper;
import hu.mes.backend.models.Product;
import hu.mes.backend.models.WorkOrder;
import hu.mes.backend.models.enums.WorkOrderStatus;
import hu.mes.backend.repositories.ProductRepository;
import hu.mes.backend.repositories.WorkOrderRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class WorkOrderService {

    private final InventoryService inventoryService;
    private final WorkOrderRepository workOrderRepository;
    private final ProductRepository productRepository;
    private final WorkOrderMapper workOrderMapper;

    public WorkOrderResponse createWorkOrder(WorkOrderCreateRequest request) {
        String orderNumber = generateOrderNumber();
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new EntityNotFoundException("Termék nem található!"));
        WorkOrder workOrder = WorkOrder.builder()
                .orderNumber(orderNumber)
                .product(product)
                .targetQuantity(request.getTargetQuantity())
                .status(request.getStatus())
                .priority(request.getPriority())
                .build();
        workOrderRepository.save(workOrder);
        return workOrderMapper.convertToResponse(workOrder);
    }

    public WorkOrderResponse updateWorkOrderStatus(UUID id, WorkOrderStatusUpdateRequest request) {
        WorkOrder workOrder = workOrderRepository.findById(id).orElseThrow(
                () -> new EntityNotFoundException("Rendelés nem található!"));

        if (request.getStatus().equals(WorkOrderStatus.COMPLETED))
            workOrder.setEndDate(LocalDateTime.now());

        else if (request.getStatus().equals(WorkOrderStatus.IN_PROGRESS))
            workOrder.setStartDate(LocalDateTime.now());

        else if (request.getStatus().equals(WorkOrderStatus.CANCELLED))
            workOrder.setEndDate(LocalDateTime.now());

        if (request.getStatus().equals(WorkOrderStatus.COMPLETED)) {
            InventoryUpdateRequest stockUpdate = new InventoryUpdateRequest(
                    workOrder.getProduct().getId(),
                    request.getProducedQuantity(),
                    null);
            inventoryService.adjustStock(stockUpdate);
        }

        workOrder.setStatus(request.getStatus());
        workOrder.setProducedQuantity(request.getProducedQuantity());
        workOrder.setScrapQuantity(request.getScrapQuantity());

        workOrderRepository.save(workOrder);
        return workOrderMapper.convertToResponse(workOrder);
    }

    public List<WorkOrderResponse> getAllWorkOrders() {
        return workOrderMapper.convertToResponses(
                workOrderRepository.findAllByOrderByCreatedAtDesc());
    }

    public WorkOrderResponse getWorkOrderById(UUID id) {
        WorkOrder order = workOrderRepository.findById(id).orElseThrow(
                () -> new EntityNotFoundException("Rendelés nem található!"));
        return workOrderMapper.convertToResponse(order);
    }

    public List<WorkOrderResponse> getWorkOrdersByStatus(WorkOrderStatus status) {
        return workOrderMapper.convertToResponses(
                workOrderRepository.findByStatus(status));
    }

    private String generateOrderNumber() {
        String prefix = "WO-";
        String dateSuffix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String uuidSuffix = UUID.randomUUID().toString().substring(0, 8);
        return prefix + dateSuffix + "-" + uuidSuffix;
    }

}
