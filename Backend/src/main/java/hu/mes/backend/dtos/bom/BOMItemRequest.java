package hu.mes.backend.dtos.bom;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
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
public class BOMItemRequest {
    @NotNull(message = "A szülő termék megadása kötelező")
    private UUID parentProductId;

    @NotNull(message = "Az összetevő termék megadása kötelező")
    private UUID componentProductId;

    @NotNull(message = "A mennyiség megadása kötelező")
    @DecimalMin(value = "0.0001", message = "A mennyiségnek nagyobbnak kell lennie nullánál")
    private BigDecimal quantity;
}
