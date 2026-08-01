package hu.mes.backend.controllers;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import hu.mes.backend.dtos.workorder.WorkOrderCreateRequest;
import hu.mes.backend.dtos.workorder.WorkOrderResponse;
import hu.mes.backend.dtos.workorder.WorkOrderStatusUpdateRequest;
import hu.mes.backend.models.enums.WorkOrderStatus;
import hu.mes.backend.services.WorkOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;

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
    public ResponseEntity<List<WorkOrderResponse>> getAll() {
        return ResponseEntity.ok(workOrderService.getAllWorkOrders());
    }

    @GetMapping("{id}")
    public ResponseEntity<WorkOrderResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(workOrderService.getWorkOrderById(id));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<WorkOrderResponse>> getByStatus(@PathVariable WorkOrderStatus status) {
        return ResponseEntity.ok(workOrderService.getWorkOrdersByStatus(status));
    }

    @PatchMapping("{id}/status")
    public ResponseEntity<WorkOrderResponse> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody WorkOrderStatusUpdateRequest request) {

        WorkOrderResponse response = workOrderService.updateWorkOrderStatus(id, request);
        return ResponseEntity.ok(response);
    }

}
