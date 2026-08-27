package hu.mes.backend.services;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import hu.mes.backend.dtos.notifications.NotificationCreateRequest;
import hu.mes.backend.dtos.notifications.NotificationResponse;
import hu.mes.backend.mappers.NotificationMapper;
import hu.mes.backend.models.Notification;
import hu.mes.backend.models.enums.NotificationType;
import hu.mes.backend.repositories.NotificationRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;

    public List<NotificationResponse> getAllNotifications() {
        return notificationMapper.convertToResponses(notificationRepository.findAll());
    }

    public List<NotificationResponse> getRecentNotifications() {
        return notificationMapper.convertToResponses(notificationRepository.findTop50ByOrderByCreatedAtDesc());
    }

    public List<NotificationResponse> getUnreadNotifications() {
        return notificationMapper.convertToResponses(notificationRepository.findByReadFalse());
    }

    public long countUnreadNotifications() {
        return notificationRepository.countByReadFalse();
    }

    public void markAllAsRead() {
        notificationRepository.markAllAsRead();
    }

    public NotificationResponse createNotification(NotificationCreateRequest request) {
        Notification notification = Notification.builder()
                .title(request.getTitle())
                .message(request.getMessage())
                .type(request.getType())
                .link(request.getLink())
                .read(false)
                .build();
        return notificationMapper.convertToResponse(notificationRepository.save(notification));
    }

    public NotificationResponse markAsRead(UUID id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setRead(true);
        return notificationMapper.convertToResponse(notificationRepository.save(notification));
    }

    public void send(String title, String message, NotificationType type, String link) {
        Notification notification = Notification.builder()
                .title(title)
                .message(message)
                .type(type)
                .link(link)
                .read(false)
                .build();
        notificationRepository.save(notification);
    }

}