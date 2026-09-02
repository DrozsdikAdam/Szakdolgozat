package hu.mes.backend.dtos.notifications;

import java.time.LocalDateTime;
import java.util.UUID;

import hu.mes.backend.models.enums.NotificationType;
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
public class NotificationResponse {
    private UUID id;
    private String title;
    private String message;
    private NotificationType type;
    private Boolean read;
    private String link;
    private LocalDateTime createdAt;
}
