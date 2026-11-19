package hu.mes.backend.dtos.sync;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
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
public class SyncBatchRequestDto {

    @NotEmpty(message = "A szinkronizációs köteg nem lehet üres!")
    @Valid
    private List<SyncItemDto> items;

    private String deviceId;

    private String submittedBy;
}
