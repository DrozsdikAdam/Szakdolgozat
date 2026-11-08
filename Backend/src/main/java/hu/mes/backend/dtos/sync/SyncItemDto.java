package hu.mes.backend.dtos.sync;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
public class SyncItemDto {

    @NotBlank(message = "A műveletazonosító (operationId) kötelező!")
    @Size(max = 64, message = "A műveletazonosító maximum 64 karakter lehet!")
    private String operationId;

    @NotBlank(message = "Az entitás neve (entityName) kötelező!")
    @Size(max = 100, message = "Az entitás neve maximum 100 karakter lehet!")
    private String entityName;

    private String entityId;

    @NotBlank(message = "A HTTP metódus kötelező!")
    @Size(max = 10, message = "A HTTP metódus maximum 10 karakter lehet!")
    private String httpMethod;

    @NotBlank(message = "A cél API végpont URL kötelező!")
    @Size(max = 255, message = "A cél API végpont URL maximum 255 karakter lehet!")
    private String endpointUrl;

    private String payloadJson;

    private Integer clientVersion;

    private LocalDateTime clientTimestamp;
}
