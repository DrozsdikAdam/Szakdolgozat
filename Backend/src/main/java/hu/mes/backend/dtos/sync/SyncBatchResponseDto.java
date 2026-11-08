package hu.mes.backend.dtos.sync;

import java.time.LocalDateTime;
import java.util.List;

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
public class SyncBatchResponseDto {

    private int totalProcessed;

    private int successCount;

    private int conflictCount;

    private int skippedCount;

    private List<SyncItemResultDto> results;

    @Builder.Default
    private LocalDateTime processedAt = LocalDateTime.now();
}
