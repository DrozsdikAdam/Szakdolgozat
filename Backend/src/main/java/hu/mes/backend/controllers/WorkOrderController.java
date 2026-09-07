package hu.mes.backend.controllers;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import hu.mes.backend.dtos.workorder.WorkOrderCreateRequest;
import hu.mes.backend.dtos.workorder.WorkOrderResponse;
import hu.mes.backend.dtos.workorder.WorkOrderStatusUpdateRequest;
import hu.mes.backend.dtos.workorder.WorkOrderUpdateRequest;
import hu.mes.backend.models.enums.WorkOrderPriority;
import hu.mes.backend.models.enums.WorkOrderStatus;
import hu.mes.backend.services.WorkOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import hu.mes.backend.dtos.common.PagedResponse;

@RestController
@RequestMapping("api/work-orders")
@RequiredArgsConstructor
public class WorkOrderController {

    private final WorkOrderService workOrderService;

    @PostMapping
    public ResponseEntity<WorkOrderResponse> createWorkOrder(
            @Valid @RequestBody WorkOrderCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(workOrderService.createWorkOrder(request));
    }

    @GetMapping
    public ResponseEntity<PagedResponse<WorkOrderResponse>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) WorkOrderStatus status) {
        return ResponseEntity.ok(workOrderService.getAllWorkOrders(status, PageRequest.of(page, size)));
    }

    @GetMapping("{id}")
    public ResponseEntity<WorkOrderResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(workOrderService.getWorkOrderById(id));
    }

    @GetMapping("/customer/{customerName}")
    public ResponseEntity<List<WorkOrderResponse>> getByCustomerName(
            @PathVariable String customerName) {
        return ResponseEntity.ok(workOrderService.getWorkOrdersByCustomerName(customerName));
    }

    @GetMapping("/priority/{priority}")
    public ResponseEntity<List<WorkOrderResponse>> getByPriority(
            @PathVariable WorkOrderPriority priority) {
        return ResponseEntity.ok(workOrderService.getWorkOrdersByPriority(priority));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<WorkOrderResponse>> getByUserId(@PathVariable UUID userId) {
        return ResponseEntity.ok(workOrderService.getWorkOrdersByAssignedUser(userId));
    }

    @PatchMapping("{id}")
    public ResponseEntity<WorkOrderResponse> updateWorkOrder(
            @PathVariable UUID id,
            @Valid @RequestBody WorkOrderUpdateRequest request) {
        return ResponseEntity.ok(workOrderService.updateWorkOrder(id, request));
    }

    @PatchMapping("{id}/user/{userId}")
    public ResponseEntity<WorkOrderResponse> updateWorkOrderUser(
            @PathVariable UUID id,
            @PathVariable UUID userId) {
        return ResponseEntity.ok(workOrderService.updateWorkOrderUser(id, userId));
    }

    @GetMapping("/status/{status}/priority/{priority}")
    public ResponseEntity<List<WorkOrderResponse>> getByStatusAndPriority(
            @PathVariable WorkOrderStatus status,
            @PathVariable WorkOrderPriority priority) {
        return ResponseEntity.ok(workOrderService.getWorkOrdersByStatusAndPriority(status, priority));
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<WorkOrderResponse>> getByProductId(@PathVariable UUID productId) {
        return ResponseEntity.ok(workOrderService.getWorkOrdersByProductId(productId));
    }

    @PatchMapping("{id}/status")
    public ResponseEntity<WorkOrderResponse> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody WorkOrderStatusUpdateRequest request) {

        WorkOrderResponse response = workOrderService.updateWorkOrderStatus(id, request);
        return ResponseEntity.ok(response);
    }

}
