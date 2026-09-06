/*
================================================================
Ez a fájl mesterséges intelligencia segítségével íródott. 
================================================================
*/
package hu.mes.backend.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import hu.mes.backend.dtos.notifications.NotificationCreateRequest;
import hu.mes.backend.dtos.notifications.NotificationResponse;
import hu.mes.backend.mappers.NotificationMapper;
import hu.mes.backend.models.Notification;
import hu.mes.backend.models.enums.NotificationType;
import hu.mes.backend.repositories.NotificationRepository;

@ExtendWith(MockitoExtension.class)
public class NotificationServiceTest {

    @InjectMocks
    private NotificationService notificationService;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private NotificationMapper notificationMapper;

    private Notification notification;
    private UUID notificationId;

    @BeforeEach
    void setUp() {
        notificationId = UUID.randomUUID();
        notification = Notification.builder()
                .title("Figyelmeztetés")
                .message("Készlethiány")
                .type(NotificationType.WARNING)
                .link("/inventory")
                .read(false)
                .build();
        notification.setId(notificationId);
    }

    @Test
    void getAllNotifications_ReturnsList() {
        when(notificationRepository.findAll()).thenReturn(List.of(notification));
        when(notificationMapper.convertToResponses(List.of(notification)))
                .thenReturn(List.of(new NotificationResponse()));

        List<NotificationResponse> result = notificationService.getAllNotifications();

        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    void getRecentNotifications_ReturnsList() {
        when(notificationRepository.findTop50ByOrderByCreatedAtDesc()).thenReturn(List.of(notification));
        when(notificationMapper.convertToResponses(List.of(notification)))
                .thenReturn(List.of(new NotificationResponse()));

        List<NotificationResponse> result = notificationService.getRecentNotifications();

        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    void getUnreadNotifications_ReturnsList() {
        when(notificationRepository.findByReadFalse()).thenReturn(List.of(notification));
        when(notificationMapper.convertToResponses(List.of(notification)))
                .thenReturn(List.of(new NotificationResponse()));

        List<NotificationResponse> result = notificationService.getUnreadNotifications();

        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    void countUnreadNotifications_ReturnsCount() {
        when(notificationRepository.countByReadFalse()).thenReturn(5L);

        long count = notificationService.countUnreadNotifications();

        assertEquals(5L, count);
    }

    @Test
    void markAllAsRead_CallsRepository() {
        notificationService.markAllAsRead();

        verify(notificationRepository).markAllAsRead();
    }

    @Test
    void createNotification_Success() {
        NotificationCreateRequest request = new NotificationCreateRequest();
        request.setTitle("Info");
        request.setMessage("Rendszer újraindítás");
        request.setType(NotificationType.INFO);
        request.setLink("/home");

        when(notificationRepository.save(any(Notification.class))).thenAnswer(i -> i.getArgument(0));
        when(notificationMapper.convertToResponse(any())).thenReturn(new NotificationResponse());

        NotificationResponse response = notificationService.createNotification(request);

        assertNotNull(response);
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void markAsRead_Success() {
        when(notificationRepository.findById(notificationId)).thenReturn(Optional.of(notification));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(i -> i.getArgument(0));
        when(notificationMapper.convertToResponse(any())).thenReturn(new NotificationResponse());

        notificationService.markAsRead(notificationId);

        assertTrue(notification.getRead());
        verify(notificationRepository).save(notification);
    }

    @Test
    void markAsRead_NotFound_ThrowsRuntimeException() {
        when(notificationRepository.findById(notificationId)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> notificationService.markAsRead(notificationId));
    }

    @Test
    void send_SavesNotification() {
        notificationService.send("Hiba", "Gép leállt", NotificationType.ERROR, "/machine");

        verify(notificationRepository).save(any(Notification.class));
    }
}
