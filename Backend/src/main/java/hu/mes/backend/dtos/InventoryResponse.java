package hu.mes.backend.dtos;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryResponse {
    private UUID id;
    private UUID productId;
    private String productSku;
    private String productName;
    private BigDecimal quantity;
    private BigDecimal reservedQuantity;
    private String location;
    private LocalDateTime updatedAt;
}