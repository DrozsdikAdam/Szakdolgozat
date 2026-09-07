/*
================================================================
Ez a fájl mesterséges intelligencia segítségével íródott. 
================================================================
*/
package hu.mes.backend.controllers;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import hu.mes.backend.dtos.notifications.NotificationResponse;
import hu.mes.backend.exceptions.GlobalExceptionHandler;
import hu.mes.backend.models.enums.NotificationType;
import hu.mes.backend.security.CustomUserDetailsService;
import hu.mes.backend.security.JwtAuthenticationFilter;
import hu.mes.backend.security.JwtUtils;
import hu.mes.backend.services.AuditLogService;
import hu.mes.backend.services.NotificationService;

@WebMvcTest(controllers = NotificationController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
public class NotificationControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private NotificationService notificationService;

    @MockitoBean
    private AuditLogService auditLogService;

    @MockitoBean
    private CacheManager cacheManager;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockitoBean
    private JwtUtils jwtUtils;

    @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

    private UUID notificationId;
    private NotificationResponse notificationResponse;

    @BeforeEach
    void setUp() {
        notificationId = UUID.randomUUID();

        notificationResponse = new NotificationResponse();
        notificationResponse.setId(notificationId);
        notificationResponse.setTitle("Rendszerüzenet");
        notificationResponse.setMessage("Alacsony készlet");
        notificationResponse.setType(NotificationType.WARNING);
        notificationResponse.setRead(false);
    }

    @Test
    void getAllNotifications_ReturnsList() throws Exception {
        when(notificationService.getAllNotifications()).thenReturn(List.of(notificationResponse));

        mockMvc.perform(get("/api/notifications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Rendszerüzenet"));
    }

    @Test
    void getUnreadCount_ReturnsCount() throws Exception {
        when(notificationService.countUnreadNotifications()).thenReturn(5L);

        mockMvc.perform(get("/api/notifications/unread-count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value(5));
    }

    @Test
    void markAsRead_Success() throws Exception {
        notificationResponse.setRead(true);
        when(notificationService.markAsRead(notificationId)).thenReturn(notificationResponse);

        mockMvc.perform(patch("/api/notifications/{id}/read", notificationId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.read").value(true));
    }

    @Test
    void markAllAsRead_ReturnsOk() throws Exception {
        mockMvc.perform(patch("/api/notifications/read-all"))
                .andExpect(status().isOk());

        verify(notificationService).markAllAsRead();
    }
}
