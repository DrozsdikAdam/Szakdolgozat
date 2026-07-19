package hu.mes.backend.dtos;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InventoryUpdateRequest {

    @NotNull(message = "A termék kitöltése kötelező")
    private UUID productId;

    @NotNull(message = "A mennyiség kitöltése kötelező")
    private BigDecimal amount;
    private String location;
}
