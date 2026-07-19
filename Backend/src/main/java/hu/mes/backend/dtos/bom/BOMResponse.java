package hu.mes.backend.dtos.bom;

import java.math.BigDecimal;
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
public class BOMResponse {

    private UUID id;
    private UUID parentProductId;
    private UUID componentProductId;
    private String componentProductName;
    private String componentProductSku;
    private BigDecimal quantity;
    private Boolean active;
}
