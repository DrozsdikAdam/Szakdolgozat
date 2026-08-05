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
import hu.mes.backend.dtos.workorder.WorkOrderUpdateRequest;
import hu.mes.backend.mappers.WorkOrderMapper;
import hu.mes.backend.models.Product;
import hu.mes.backend.models.User;
import hu.mes.backend.models.WorkOrder;
import hu.mes.backend.models.enums.WorkOrderPriority;
import hu.mes.backend.models.enums.WorkOrderStatus;
import hu.mes.backend.repositories.ProductRepository;
import hu.mes.backend.repositories.UserRepository;
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
        private final UserRepository userRepository;

        public WorkOrderResponse createWorkOrder(WorkOrderCreateRequest request) {
                String orderNumber = generateOrderNumber();

                Product product = productRepository.findById(request.getProductId())
                                .orElseThrow(() -> new EntityNotFoundException("Termék nem található!"));

                User user = request.getAssignedUserId() != null
                                ? userRepository.findById(request.getAssignedUserId()).orElse(null)
                                : null;

                WorkOrder workOrder = WorkOrder.builder()
                                .orderNumber(orderNumber)
                                .product(product)
                                .targetQuantity(request.getTargetQuantity())
                                .status(request.getStatus())
                                .priority(request.getPriority())
                                .customerName(request.getCustomerName())
                                .assignedUser(user)
                                .build();
                workOrderRepository.save(workOrder);
                return workOrderMapper.convertToResponse(workOrder);
        }

        public WorkOrderResponse updateWorkOrderStatus(UUID id, WorkOrderStatusUpdateRequest request) {
                WorkOrder workOrder = workOrderRepository.findById(id).orElseThrow(
                                () -> new EntityNotFoundException("Rendelés nem található!"));

                if (request.getStatus() != WorkOrderStatus.PLANNED && request.getStatus() != WorkOrderStatus.CANCELLED) {
                        if (workOrder.getAssignedUser() == null) {
                                throw new IllegalStateException("A gyártási folyamat nem indítható el felelős operátor hozzárendelése nélkül! Kérjük, előbb rendeljen hozzá felelőst a szerkesztés gombra kattintva.");
                        }
                }

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

        public List<WorkOrderResponse> getWorkOrdersByPriority(WorkOrderPriority priority) {
                return workOrderMapper.convertToResponses(
                                workOrderRepository.findByPriority(priority));
        }

        public List<WorkOrderResponse> getWorkOrdersByCustomerName(String customerName) {
                return workOrderMapper.convertToResponses(
                                workOrderRepository.findByCustomerName(customerName));
        }

        public List<WorkOrderResponse> getWorkOrdersByAssignedUser(UUID userId) {
                User user = userRepository.findById(userId).orElseThrow(
                                () -> new EntityNotFoundException("Felhasználó nem található!"));

                return workOrderMapper.convertToResponses(
                                workOrderRepository.findByAssignedUser(user));
        }

        public WorkOrderResponse updateWorkOrder(UUID id, WorkOrderUpdateRequest request) {
                WorkOrder workOrder = workOrderRepository.findById(id).orElseThrow(
                                () -> new EntityNotFoundException("Rendelés nem található!"));

                User user = request.getAssignedUserId() != null
                                ? userRepository.findById(request.getAssignedUserId()).orElse(null)
                                : null;

                workOrder.setAssignedUser(user);
                workOrder.setTargetQuantity(request.getTargetQuantity());
                workOrder.setPriority(request.getPriority());
                workOrder.setCustomerName(request.getCustomerName());

                workOrderRepository.save(workOrder);
                return workOrderMapper.convertToResponse(workOrder);
        }

        public WorkOrderResponse updateWorkOrderUser(UUID id, UUID userId) {
                WorkOrder workOrder = workOrderRepository.findById(id).orElseThrow(
                                () -> new EntityNotFoundException("Rendelés nem található!"));

                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new EntityNotFoundException("Felhasználó nem található!"));

                workOrder.setAssignedUser(user);
                workOrderRepository.save(workOrder);
                return workOrderMapper.convertToResponse(workOrder);
        }

        public List<WorkOrderResponse> getWorkOrdersByStatusAndPriority(WorkOrderStatus status,
                        WorkOrderPriority priority) {
                return workOrderMapper.convertToResponses(
                                workOrderRepository.findByStatusAndPriority(status, priority));
        }

        public List<WorkOrderResponse> getWorkOrdersByProductId(UUID productId) {
                Product product = productRepository.findById(productId).orElseThrow(
                                () -> new EntityNotFoundException("Termék nem található!"));
                return workOrderMapper.convertToResponses(
                                workOrderRepository.findByProductId(product.getId()));
        }

        private String generateOrderNumber() {
                String prefix = "WO-";
                String dateSuffix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
                String uuidSuffix = UUID.randomUUID().toString().substring(0, 8);
                return prefix + dateSuffix + "-" + uuidSuffix;
        }

}
