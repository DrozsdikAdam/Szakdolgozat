package hu.mes.backend.models;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import hu.mes.backend.models.enums.WorkOrderPriority;
import hu.mes.backend.models.enums.WorkOrderStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "work_orders")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class WorkOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(unique = true, nullable = false)
    private String orderNumber;
    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = true)
    private User assignedUser;

    @Column(nullable = false, length = 100)
    private String customerName;

    @Column(nullable = false, precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal targetQuantity = BigDecimal.ZERO;
    @Column(nullable = false, precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal producedQuantity = BigDecimal.ZERO;
    @Column(nullable = false, precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal scrapQuantity = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    @Enumerated(EnumType.STRING)
    private WorkOrderStatus status = WorkOrderStatus.PLANNED;
    @Column(nullable = false)
    @Builder.Default
    @Enumerated(EnumType.STRING)
    private WorkOrderPriority priority = WorkOrderPriority.MEDIUM;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime startDate;
    private LocalDateTime endDate;

    @Version
    @Builder.Default
    private Integer version = 0;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
