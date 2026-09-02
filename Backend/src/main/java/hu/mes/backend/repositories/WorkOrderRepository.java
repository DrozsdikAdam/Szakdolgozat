package hu.mes.backend.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import hu.mes.backend.models.User;
import hu.mes.backend.models.WorkOrder;
import hu.mes.backend.models.enums.WorkOrderPriority;
import hu.mes.backend.models.enums.WorkOrderStatus;

@Repository
public interface WorkOrderRepository extends JpaRepository<WorkOrder, UUID> {

    List<WorkOrder> findByCustomerName(String customerName);

    List<WorkOrder> findByAssignedUser(User assignedUser);

    boolean existsByOrderNumber(String orderNumber);

    List<WorkOrder> findByPriority(WorkOrderPriority priority);

    List<WorkOrder> findByProductId(UUID id);

    List<WorkOrder> findByStatusAndPriority(WorkOrderStatus status, WorkOrderPriority priority);

    Page<WorkOrder> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<WorkOrder> findByStatusOrderByCreatedAtDesc(WorkOrderStatus status, Pageable pageable);
}
