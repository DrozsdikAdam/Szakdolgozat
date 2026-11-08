package hu.mes.backend.dtos.sync;

import hu.mes.backend.models.enums.ResolutionStrategy;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class ConflictResolutionRequest {

    @NotNull(message = "A feloldási stratégia megadása kötelező!")
    private ResolutionStrategy strategy;

    private String mergedPayloadJson;

    private String resolvedBy;
}
