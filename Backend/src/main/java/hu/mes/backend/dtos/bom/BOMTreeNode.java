package hu.mes.backend.dtos.bom;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BOMTreeNode {

    private UUID productId;
    private String productName;
    private String productSku;
    private String unit;
    private BigDecimal quantity;
    private List<BOMTreeNode> children;

}
