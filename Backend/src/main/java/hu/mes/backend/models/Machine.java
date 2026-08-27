package hu.mes.backend.models;

import java.time.LocalDateTime;
import java.util.UUID;

import hu.mes.backend.models.enums.MachineStatus;
import hu.mes.backend.models.enums.MachineType;
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
@Table(name = "machines")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class Machine extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String code;

    @Column(nullable = false)
    private String name;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MachineType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MachineStatus status;

    private String manufacturer;
    private String model;
    private String serialNumber;
    private String warrantyNumber;
    private LocalDateTime warrantyEndDate;

    private Double idealCycleTimeSeconds;
    private Integer targetPcsPerHour;
    private String location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_user_id")
    private User assignedUser;

    @Builder.Default
    private Boolean active = true;

    private LocalDateTime deletedAt;

}
