package hu.mes.backend.dtos.product;

import jakarta.validation.constraints.NotBlank;
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
public class ProductUpdateRequest {
    @NotBlank(message = "A terméknév kitöltése kötelező")
    private String name;
    @NotBlank(message = "A cikkszám kitöltése kötelező")
    private String sku;
    private String description;
    @NotBlank(message = "Az egység kitöltése kötelező")
    private String unit;
}
