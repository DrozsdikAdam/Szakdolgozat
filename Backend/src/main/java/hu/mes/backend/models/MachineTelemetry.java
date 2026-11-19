package hu.mes.backend.models;

import java.time.LocalDateTime;
import java.util.UUID;

import hu.mes.backend.models.enums.MachineStatus;
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

@Entity
@Table(name = "machine_telemetry")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class MachineTelemetry extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "machine_id", nullable = false)
    private Machine machine;
    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime timestamp;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, name = "machine_status")
    private MachineStatus status;

    @Column(name = "produced_count")
    private Integer producedCount;
    @Column(name = "scrap_count")
    private Integer scrapCount;
    private Double temperature;
    private Double vibration;
    @Column(name = "power_kw")
    private Double powerKw;
    @Column(name = "pressure_bar")
    private Double pressureBar;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_order_id")
    private WorkOrder activeWorkOrder;

}
