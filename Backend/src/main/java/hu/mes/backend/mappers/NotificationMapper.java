package hu.mes.backend.mappers;

import java.util.List;

import org.springframework.stereotype.Component;

import hu.mes.backend.dtos.notifications.NotificationResponse;
import hu.mes.backend.models.Notification;

@Component
public class NotificationMapper {
    public NotificationResponse convertToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType())
                .read(notification.getRead())
                .link(notification.getLink())
                .createdAt(notification.getCreatedAt())
                .build();
    }

    public List<NotificationResponse> convertToResponses(List<Notification> notifications) {
        return notifications.stream()
                .map(this::convertToResponse)
                .toList();
    }
}
