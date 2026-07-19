package hu.mes.backend.dtos.product;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductCreateRequest {
    @NotBlank(message = "A terméknév kitöltése kötelező")
    private String name;
    @NotBlank(message = "A cikkszám kitöltése kötelező")
    @Pattern(regexp = "^[a-zA-Z0-9-]+$", message = "A cikkszám csak betűket, számokat és kötőjelet tartalmazhat")
    private String sku;
    private String description;
    @NotBlank(message = "Az egység kitöltése kötelező")
    private String unit;

}
