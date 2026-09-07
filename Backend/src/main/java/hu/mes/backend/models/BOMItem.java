package hu.mes.backend.models;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "bom_items")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BOMItem extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne
    @JoinColumn(name = "parent_product_id", nullable = false)
    private Product parentProduct;
    @ManyToOne
    @JoinColumn(name = "component_product_id", nullable = false)
    private Product componentProduct;
    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal quantity;
    @Builder.Default
    private Boolean active = true;

}
