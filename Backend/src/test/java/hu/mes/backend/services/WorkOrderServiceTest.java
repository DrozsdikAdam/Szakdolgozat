/*
================================================================
Ez a fájl mesterséges intelligencia segítségével íródott. 
================================================================
*/
package hu.mes.backend.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import hu.mes.backend.dtos.workorder.WorkOrderCreateRequest;
import hu.mes.backend.dtos.workorder.WorkOrderResponse;
import hu.mes.backend.dtos.workorder.WorkOrderStatusUpdateRequest;
import hu.mes.backend.dtos.workorder.WorkOrderUpdateRequest;
import hu.mes.backend.mappers.WorkOrderMapper;
import hu.mes.backend.models.Product;
import hu.mes.backend.models.User;
import hu.mes.backend.models.WorkOrder;
import hu.mes.backend.dtos.inventory.InventoryUpdateRequest;
import hu.mes.backend.models.enums.NotificationType;
import hu.mes.backend.models.enums.WorkOrderPriority;
import hu.mes.backend.models.enums.WorkOrderStatus;
import hu.mes.backend.repositories.InventoryRepository;
import hu.mes.backend.repositories.ProductRepository;
import hu.mes.backend.repositories.UserRepository;
import hu.mes.backend.repositories.WorkOrderRepository;
import jakarta.persistence.EntityNotFoundException;

@ExtendWith(MockitoExtension.class)
public class WorkOrderServiceTest {

        @InjectMocks
        private WorkOrderService workOrderService;

        @Mock
        private WorkOrderRepository workOrderRepository;

        @Mock
        private ProductRepository productRepository;

        @Mock
        private UserRepository userRepository;

        @Mock
        private WorkOrderMapper workOrderMapper;

        @Mock
        private InventoryService inventoryService;

        @Mock
        private InventoryRepository inventoryRepository;

        @Mock
        private BOMInventoryService bomInventoryService;

        @Mock
        private NotificationService notificationService;

        @Mock
        private AuditLogService auditLogService;

        @Test
        void createWorkOrderSuccess() {
                Product mockProduct = new Product();
                mockProduct.setId(UUID.randomUUID());
                mockProduct.setSku("SKU001");
                mockProduct.setName("Test Product");
                mockProduct.setUnit("Piece");
                mockProduct.setDeleted(false);
                mockProduct.setActive(true);

                User mockUser = new User();
                mockUser.setId(UUID.randomUUID());
                mockUser.setName("operator1");

                WorkOrderCreateRequest request = WorkOrderCreateRequest.builder()
                                .productId(mockProduct.getId())
                                .targetQuantity(BigDecimal.valueOf(100))
                                .status(WorkOrderStatus.PLANNED)
                                .priority(WorkOrderPriority.MEDIUM)
                                .customerName("Test Customer")
                                .assignedUserId(mockUser.getId())
                                .build();

                WorkOrderResponse mockResponse = WorkOrderResponse.builder()
                                .id(UUID.randomUUID())
                                .orderNumber("WO-2026-0001")
                                .targetQuantity(request.getTargetQuantity())
                                .status(request.getStatus())
                                .build();

                when(productRepository.findById(mockProduct.getId())).thenReturn(Optional.of(mockProduct));
                when(userRepository.findById(mockUser.getId())).thenReturn(Optional.of(mockUser));
                when(workOrderRepository.save(any(WorkOrder.class)))
                                .thenAnswer(invocation -> invocation.getArgument(0));
                when(workOrderMapper.convertToResponse(any(WorkOrder.class))).thenReturn(mockResponse);

                WorkOrderResponse response = workOrderService.createWorkOrder(request);

                assertNotNull(response);
                assertEquals(mockResponse.getOrderNumber(), response.getOrderNumber());
                verify(workOrderRepository).save(any(WorkOrder.class));
                verify(auditLogService).log(any(), any(), any(), any(), any(), any());
        }

        @Test
        void createWorkOrderProductNotFound() {
                WorkOrderCreateRequest request = WorkOrderCreateRequest.builder()
                                .productId(UUID.randomUUID())
                                .targetQuantity(BigDecimal.valueOf(100))
                                .status(WorkOrderStatus.PLANNED)
                                .priority(WorkOrderPriority.MEDIUM)
                                .customerName("Test Customer")
                                .assignedUserId(UUID.randomUUID())
                                .build();

                when(productRepository.findById(any(UUID.class))).thenReturn(Optional.empty());

                assertThrows(EntityNotFoundException.class, () -> workOrderService.createWorkOrder(request));
        }

        @Test
        void createWorkOrder_InProgressWithoutAssignedUser_ThrowsIllegalStateException() {
                Product mockProduct = new Product();
                mockProduct.setId(UUID.randomUUID());

                WorkOrderCreateRequest request = WorkOrderCreateRequest.builder()
                                .productId(mockProduct.getId())
                                .targetQuantity(BigDecimal.valueOf(50))
                                .status(WorkOrderStatus.IN_PROGRESS)
                                .priority(WorkOrderPriority.HIGH)
                                .customerName("Customer A")
                                .assignedUserId(null)
                                .build();

                when(productRepository.findById(mockProduct.getId())).thenReturn(Optional.of(mockProduct));

                assertThrows(IllegalStateException.class, () -> workOrderService.createWorkOrder(request));
                verify(workOrderRepository, never()).save(any());
        }

        @Test
        void createWorkOrder_PreparedStatus_ValidatesAndReservesStock() {
                Product mockProduct = new Product();
                mockProduct.setId(UUID.randomUUID());
                mockProduct.setName("Gearbox");

                User mockUser = new User();
                mockUser.setId(UUID.randomUUID());
                mockUser.setName("mechanic1");

                WorkOrderCreateRequest request = WorkOrderCreateRequest.builder()
                                .productId(mockProduct.getId())
                                .targetQuantity(BigDecimal.valueOf(20))
                                .status(WorkOrderStatus.PREPARED)
                                .priority(WorkOrderPriority.LOW)
                                .customerName("Customer B")
                                .assignedUserId(mockUser.getId())
                                .build();

                WorkOrderResponse mockResponse = WorkOrderResponse.builder()
                                .id(UUID.randomUUID())
                                .status(WorkOrderStatus.PREPARED)
                                .build();

                when(productRepository.findById(mockProduct.getId())).thenReturn(Optional.of(mockProduct));
                when(userRepository.findById(mockUser.getId())).thenReturn(Optional.of(mockUser));
                when(workOrderMapper.convertToResponse(any(WorkOrder.class))).thenReturn(mockResponse);

                WorkOrderResponse response = workOrderService.createWorkOrder(request);

                assertNotNull(response);
                verify(bomInventoryService).validateComponentStock(mockProduct, request.getTargetQuantity());
                verify(bomInventoryService).reserveComponentStock(mockProduct, request.getTargetQuantity());
                verify(workOrderRepository).save(any(WorkOrder.class));
        }

        @Test
        void updateWorkOrderStatus_WithoutAssignedUser_ThrowsIllegalStateException() {
                WorkOrder workOrder = WorkOrder.builder()
                                .id(UUID.randomUUID())
                                .status(WorkOrderStatus.PLANNED)
                                .assignedUser(null)
                                .build();

                WorkOrderStatusUpdateRequest request = new WorkOrderStatusUpdateRequest();
                request.setStatus(WorkOrderStatus.IN_PROGRESS);

                when(workOrderRepository.findById(workOrder.getId())).thenReturn(Optional.of(workOrder));

                assertThrows(IllegalStateException.class,
                                () -> workOrderService.updateWorkOrderStatus(workOrder.getId(), request));
        }

        @Test
        void updateWorkOrderStatus_NotFound_ThrowsEntityNotFoundException() {
                UUID randomId = UUID.randomUUID();
                WorkOrderStatusUpdateRequest request = new WorkOrderStatusUpdateRequest();
                request.setStatus(WorkOrderStatus.PLANNED);

                when(workOrderRepository.findById(randomId)).thenReturn(Optional.empty());

                assertThrows(EntityNotFoundException.class,
                                () -> workOrderService.updateWorkOrderStatus(randomId, request));
        }

        @Test
        void updateWorkOrderStatus_PlannedToPrepared_ValidatesAndReservesStock() {
                Product mockProduct = new Product();
                mockProduct.setId(UUID.randomUUID());
                mockProduct.setName("Test Product");

                User mockUser = new User();
                mockUser.setId(UUID.randomUUID());

                WorkOrder workOrder = WorkOrder.builder()
                                .id(UUID.randomUUID())
                                .orderNumber("WO-101")
                                .status(WorkOrderStatus.PLANNED)
                                .product(mockProduct)
                                .assignedUser(mockUser)
                                .targetQuantity(BigDecimal.valueOf(30))
                                .build();

                WorkOrderStatusUpdateRequest request = WorkOrderStatusUpdateRequest.builder()
                                .status(WorkOrderStatus.PREPARED)
                                .build();

                WorkOrderResponse mockResponse = WorkOrderResponse.builder()
                                .id(workOrder.getId())
                                .status(WorkOrderStatus.PREPARED)
                                .build();

                when(workOrderRepository.findById(workOrder.getId())).thenReturn(Optional.of(workOrder));
                when(workOrderMapper.convertToResponse(any(WorkOrder.class))).thenReturn(mockResponse);

                WorkOrderResponse response = workOrderService.updateWorkOrderStatus(workOrder.getId(), request);

                assertNotNull(response);
                assertEquals(WorkOrderStatus.PREPARED, response.getStatus());
                verify(bomInventoryService).validateComponentStock(mockProduct, workOrder.getTargetQuantity());
                verify(bomInventoryService).reserveComponentStock(mockProduct, workOrder.getTargetQuantity());
                verify(workOrderRepository).save(workOrder);
        }

        @Test
        void updateWorkOrderStatus_PlannedToInProgress_SetsStartDateAndReservesStock() {
                Product mockProduct = new Product();
                mockProduct.setId(UUID.randomUUID());
                mockProduct.setName("Test Product");

                User mockUser = new User();
                mockUser.setId(UUID.randomUUID());

                WorkOrder workOrder = WorkOrder.builder()
                                .id(UUID.randomUUID())
                                .orderNumber("WO-102")
                                .status(WorkOrderStatus.PLANNED)
                                .product(mockProduct)
                                .assignedUser(mockUser)
                                .targetQuantity(BigDecimal.valueOf(50))
                                .build();

                WorkOrderStatusUpdateRequest request = WorkOrderStatusUpdateRequest.builder()
                                .status(WorkOrderStatus.IN_PROGRESS)
                                .build();

                WorkOrderResponse mockResponse = WorkOrderResponse.builder()
                                .id(workOrder.getId())
                                .status(WorkOrderStatus.IN_PROGRESS)
                                .build();

                when(workOrderRepository.findById(workOrder.getId())).thenReturn(Optional.of(workOrder));
                when(workOrderMapper.convertToResponse(any(WorkOrder.class))).thenReturn(mockResponse);

                WorkOrderResponse response = workOrderService.updateWorkOrderStatus(workOrder.getId(), request);

                assertNotNull(response);
                assertNotNull(workOrder.getStartDate());
                verify(bomInventoryService).validateComponentStock(mockProduct, workOrder.getTargetQuantity());
                verify(bomInventoryService).reserveComponentStock(mockProduct, workOrder.getTargetQuantity());
                verify(workOrderRepository).save(workOrder);
        }

        @Test
        void updateWorkOrderStatus_ToCompleted_ConsumesStockAndAdjustsInventory() {
                Product mockProduct = new Product();
                mockProduct.setId(UUID.randomUUID());
                mockProduct.setName("Completed Product");

                User mockUser = new User();
                mockUser.setId(UUID.randomUUID());

                WorkOrder workOrder = WorkOrder.builder()
                                .id(UUID.randomUUID())
                                .orderNumber("WO-COMP-001")
                                .status(WorkOrderStatus.IN_PROGRESS)
                                .product(mockProduct)
                                .assignedUser(mockUser)
                                .targetQuantity(BigDecimal.valueOf(100))
                                .build();

                WorkOrderStatusUpdateRequest request = WorkOrderStatusUpdateRequest.builder()
                                .status(WorkOrderStatus.COMPLETED)
                                .producedQuantity(BigDecimal.valueOf(100))
                                .scrapQuantity(BigDecimal.valueOf(5))
                                .build();

                WorkOrderResponse mockResponse = WorkOrderResponse.builder()
                                .id(workOrder.getId())
                                .orderNumber(workOrder.getOrderNumber())
                                .status(WorkOrderStatus.COMPLETED)
                                .producedQuantity(request.getProducedQuantity())
                                .scrapQuantity(request.getScrapQuantity())
                                .build();

                when(workOrderRepository.findById(workOrder.getId())).thenReturn(Optional.of(workOrder));
                when(workOrderMapper.convertToResponse(any(WorkOrder.class))).thenReturn(mockResponse);

                WorkOrderResponse response = workOrderService.updateWorkOrderStatus(workOrder.getId(), request);

                assertNotNull(response);
                assertEquals(WorkOrderStatus.COMPLETED, response.getStatus());
                assertNotNull(workOrder.getEndDate());
                verify(bomInventoryService).consumeComponentStock(mockProduct, workOrder.getTargetQuantity());
                verify(inventoryService).adjustStock(any(InventoryUpdateRequest.class));
                verify(notificationService).send(any(), any(), eq(NotificationType.SUCCESS), any());
                verify(workOrderRepository).save(workOrder);
                verify(auditLogService).log(any(), any(), any(), any(), any(), any());
        }

        @Test
        void updateWorkOrderStatus_Cancelled_ReleasesComponentStock() {
                Product mockProduct = new Product();
                mockProduct.setId(UUID.randomUUID());

                User mockUser = new User();
                mockUser.setId(UUID.randomUUID());

                WorkOrder workOrder = WorkOrder.builder()
                                .id(UUID.randomUUID())
                                .orderNumber("WO-CANCEL-001")
                                .status(WorkOrderStatus.IN_PROGRESS)
                                .product(mockProduct)
                                .assignedUser(mockUser)
                                .targetQuantity(BigDecimal.valueOf(40))
                                .build();

                WorkOrderStatusUpdateRequest request = WorkOrderStatusUpdateRequest.builder()
                                .status(WorkOrderStatus.CANCELLED)
                                .build();

                WorkOrderResponse mockResponse = WorkOrderResponse.builder()
                                .id(workOrder.getId())
                                .status(WorkOrderStatus.CANCELLED)
                                .build();

                when(workOrderRepository.findById(workOrder.getId())).thenReturn(Optional.of(workOrder));
                when(workOrderMapper.convertToResponse(any(WorkOrder.class))).thenReturn(mockResponse);

                WorkOrderResponse response = workOrderService.updateWorkOrderStatus(workOrder.getId(), request);

                assertNotNull(response);
                assertEquals(WorkOrderStatus.CANCELLED, response.getStatus());
                assertNotNull(workOrder.getEndDate());
                verify(bomInventoryService).releaseComponentStock(mockProduct, workOrder.getTargetQuantity());
                verify(workOrderRepository).save(workOrder);
        }

        @Test
        void updateWorkOrderStatus_Cancelled_WhenPlanned_DoesNotReleaseStock() {
                Product mockProduct = new Product();
                mockProduct.setId(UUID.randomUUID());

                WorkOrder workOrder = WorkOrder.builder()
                                .id(UUID.randomUUID())
                                .orderNumber("WO-CANCEL-002")
                                .status(WorkOrderStatus.PLANNED)
                                .product(mockProduct)
                                .targetQuantity(BigDecimal.valueOf(40))
                                .build();

                WorkOrderStatusUpdateRequest request = WorkOrderStatusUpdateRequest.builder()
                                .status(WorkOrderStatus.CANCELLED)
                                .build();

                WorkOrderResponse mockResponse = WorkOrderResponse.builder()
                                .id(workOrder.getId())
                                .status(WorkOrderStatus.CANCELLED)
                                .build();

                when(workOrderRepository.findById(workOrder.getId())).thenReturn(Optional.of(workOrder));
                when(workOrderMapper.convertToResponse(any(WorkOrder.class))).thenReturn(mockResponse);

                WorkOrderResponse response = workOrderService.updateWorkOrderStatus(workOrder.getId(), request);

                assertNotNull(response);
                verify(inventoryService, never()).releaseReservedStock(any());
                verify(workOrderRepository).save(workOrder);
        }

        @Test
        void getWorkOrderById_Success() {
                UUID orderId = UUID.randomUUID();
                WorkOrder workOrder = WorkOrder.builder().id(orderId).orderNumber("WO-GET-001").build();
                WorkOrderResponse mockResponse = WorkOrderResponse.builder().id(orderId).orderNumber("WO-GET-001")
                                .build();

                when(workOrderRepository.findById(orderId)).thenReturn(Optional.of(workOrder));
                when(workOrderMapper.convertToResponse(workOrder)).thenReturn(mockResponse);

                WorkOrderResponse response = workOrderService.getWorkOrderById(orderId);

                assertNotNull(response);
                assertEquals("WO-GET-001", response.getOrderNumber());
        }

        @Test
        void getWorkOrderById_NotFound_ThrowsEntityNotFoundException() {
                UUID orderId = UUID.randomUUID();
                when(workOrderRepository.findById(orderId)).thenReturn(Optional.empty());

                assertThrows(EntityNotFoundException.class, () -> workOrderService.getWorkOrderById(orderId));
        }

        @Test
        void updateWorkOrder_Success() {
                UUID orderId = UUID.randomUUID();
                User mockUser = new User();
                mockUser.setId(UUID.randomUUID());

                WorkOrder workOrder = WorkOrder.builder()
                                .id(orderId)
                                .orderNumber("WO-UPD-001")
                                .targetQuantity(BigDecimal.valueOf(100))
                                .priority(WorkOrderPriority.LOW)
                                .customerName("Old Customer")
                                .build();

                WorkOrderUpdateRequest request = new WorkOrderUpdateRequest(
                                BigDecimal.valueOf(200),
                                WorkOrderPriority.URGENT,
                                "New Customer",
                                mockUser.getId());

                WorkOrderResponse mockResponse = WorkOrderResponse.builder()
                                .id(orderId)
                                .targetQuantity(BigDecimal.valueOf(200))
                                .priority(WorkOrderPriority.URGENT)
                                .customerName("New Customer")
                                .build();

                when(workOrderRepository.findById(orderId)).thenReturn(Optional.of(workOrder));
                when(userRepository.findById(mockUser.getId())).thenReturn(Optional.of(mockUser));
                when(workOrderMapper.convertToResponse(workOrder)).thenReturn(mockResponse);

                WorkOrderResponse response = workOrderService.updateWorkOrder(orderId, request);

                assertNotNull(response);
                assertEquals(BigDecimal.valueOf(200), workOrder.getTargetQuantity());
                assertEquals(WorkOrderPriority.URGENT, workOrder.getPriority());
                assertEquals("New Customer", workOrder.getCustomerName());
                assertEquals(mockUser, workOrder.getAssignedUser());
                verify(workOrderRepository).save(workOrder);
                verify(auditLogService).log(any(), any(), any(), any());
        }

        @Test
        void updateWorkOrderUser_Success() {
                UUID orderId = UUID.randomUUID();
                UUID userId = UUID.randomUUID();

                User mockUser = new User();
                mockUser.setId(userId);
                mockUser.setName("lead_operator");

                WorkOrder workOrder = WorkOrder.builder()
                                .id(orderId)
                                .orderNumber("WO-USER-001")
                                .assignedUser(null)
                                .build();

                WorkOrderResponse mockResponse = WorkOrderResponse.builder()
                                .id(orderId)
                                .assignedUserId(userId)
                                .build();

                when(workOrderRepository.findById(orderId)).thenReturn(Optional.of(workOrder));
                when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
                when(workOrderMapper.convertToResponse(workOrder)).thenReturn(mockResponse);

                WorkOrderResponse response = workOrderService.updateWorkOrderUser(orderId, userId);

                assertNotNull(response);
                assertEquals(mockUser, workOrder.getAssignedUser());
                verify(workOrderRepository).save(workOrder);
                verify(auditLogService).log(any(), any(), any(), any());
        }

        @Test
        void updateWorkOrderUser_UserNotFound_ThrowsEntityNotFoundException() {
                UUID orderId = UUID.randomUUID();
                UUID userId = UUID.randomUUID();

                WorkOrder workOrder = WorkOrder.builder().id(orderId).build();

                when(workOrderRepository.findById(orderId)).thenReturn(Optional.of(workOrder));
                when(userRepository.findById(userId)).thenReturn(Optional.empty());

                assertThrows(EntityNotFoundException.class,
                                () -> workOrderService.updateWorkOrderUser(orderId, userId));
        }

        @Test
        void getWorkOrdersByProductId_Success() {
                UUID productId = UUID.randomUUID();
                Product mockProduct = new Product();
                mockProduct.setId(productId);

                WorkOrder order1 = WorkOrder.builder().id(UUID.randomUUID()).build();
                WorkOrder order2 = WorkOrder.builder().id(UUID.randomUUID()).build();

                when(productRepository.findById(productId)).thenReturn(Optional.of(mockProduct));
                when(workOrderRepository.findByProductId(productId)).thenReturn(List.of(order1, order2));
                when(workOrderMapper.convertToResponses(any())).thenReturn(List.of(
                                WorkOrderResponse.builder().id(order1.getId()).build(),
                                WorkOrderResponse.builder().id(order2.getId()).build()));

                List<WorkOrderResponse> result = workOrderService.getWorkOrdersByProductId(productId);

                assertNotNull(result);
                assertEquals(2, result.size());
        }

        @Test
        void getWorkOrdersByProductId_NotFound_ThrowsEntityNotFoundException() {
                UUID productId = UUID.randomUUID();
                when(productRepository.findById(productId)).thenReturn(Optional.empty());

                assertThrows(EntityNotFoundException.class, () -> workOrderService.getWorkOrdersByProductId(productId));
        }

}
