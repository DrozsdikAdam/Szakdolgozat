package hu.mes.backend.models;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import hu.mes.backend.models.enums.MaintenanceStatus;
import hu.mes.backend.models.enums.MaintenanceType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "machine_maintenance")
@Builder
public class MachineMaintenance extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "machine_id", nullable = false)
    private Machine machine;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technician_id")
    private User technician;
    @Column(nullable = false)
    private String title;
    private String description;
    private String rootCause;
    private String actionTaken;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MaintenanceStatus status;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MaintenanceType type;
    private Integer downtimeMinutes;
    private BigDecimal cost;
    @Column(name = "start_date")
    private LocalDateTime start;
    @Column(name = "maintenance_end")
    private LocalDateTime end;

}
