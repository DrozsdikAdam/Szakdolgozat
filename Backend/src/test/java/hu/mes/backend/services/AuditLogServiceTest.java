/*
================================================================
Ez a fájl mesterséges intelligencia segítségével íródott. 
================================================================
*/

package hu.mes.backend.services;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import hu.mes.backend.dtos.audit.AuditLogResponse;
import hu.mes.backend.dtos.common.PagedResponse;
import hu.mes.backend.mappers.AuditLogMapper;
import hu.mes.backend.models.AuditLog;
import hu.mes.backend.models.enums.AuditAction;
import hu.mes.backend.models.enums.AuditEntityType;
import hu.mes.backend.repositories.AuditLogRepository;
import hu.mes.backend.security.CustomUserDetails;

@ExtendWith(MockitoExtension.class)
public class AuditLogServiceTest {

    @InjectMocks
    private AuditLogService auditLogService;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private AuditLogMapper auditLogMapper;

    private Pageable pageable;
    private AuditLog auditLog;

    @BeforeEach
    void setUp() {
        pageable = PageRequest.of(0, 10);
        auditLog = AuditLog.builder()
                .username("operator1")
                .action(AuditAction.CREATE)
                .entityType(AuditEntityType.PRODUCT)
                .entityId("SKU-100")
                .details("Új termék")
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getLogs_WithBothFilters_CallsCorrectRepositoryMethod() {
        Page<AuditLog> page = new PageImpl<>(List.of(auditLog));
        when(auditLogRepository.findByEntityTypeAndActionOrderByTimestampDesc(AuditEntityType.PRODUCT,
                AuditAction.CREATE, pageable))
                .thenReturn(page);
        when(auditLogMapper.convertToResponses(List.of(auditLog))).thenReturn(List.of(new AuditLogResponse()));

        PagedResponse<AuditLogResponse> response = auditLogService.getLogs(AuditEntityType.PRODUCT, AuditAction.CREATE,
                pageable);

        assertNotNull(response);
        verify(auditLogRepository).findByEntityTypeAndActionOrderByTimestampDesc(AuditEntityType.PRODUCT,
                AuditAction.CREATE, pageable);
    }

    @Test
    void getLogs_WithOnlyEntityType_CallsCorrectRepositoryMethod() {
        Page<AuditLog> page = new PageImpl<>(List.of(auditLog));
        when(auditLogRepository.findAllByEntityTypeOrderByTimestampDesc(AuditEntityType.PRODUCT, pageable))
                .thenReturn(page);
        when(auditLogMapper.convertToResponses(List.of(auditLog))).thenReturn(List.of(new AuditLogResponse()));

        PagedResponse<AuditLogResponse> response = auditLogService.getLogs(AuditEntityType.PRODUCT, null, pageable);

        assertNotNull(response);
        verify(auditLogRepository).findAllByEntityTypeOrderByTimestampDesc(AuditEntityType.PRODUCT, pageable);
    }

    @Test
    void getLogs_WithOnlyAction_CallsCorrectRepositoryMethod() {
        Page<AuditLog> page = new PageImpl<>(List.of(auditLog));
        when(auditLogRepository.findAllByActionOrderByTimestampDesc(AuditAction.CREATE, pageable))
                .thenReturn(page);
        when(auditLogMapper.convertToResponses(List.of(auditLog))).thenReturn(List.of(new AuditLogResponse()));

        PagedResponse<AuditLogResponse> response = auditLogService.getLogs(null, AuditAction.CREATE, pageable);

        assertNotNull(response);
        verify(auditLogRepository).findAllByActionOrderByTimestampDesc(AuditAction.CREATE, pageable);
    }

    @Test
    void getLogs_WithNoFilters_CallsFindAll() {
        Page<AuditLog> page = new PageImpl<>(List.of(auditLog));
        when(auditLogRepository.findAllByOrderByTimestampDesc(pageable)).thenReturn(page);
        when(auditLogMapper.convertToResponses(List.of(auditLog))).thenReturn(List.of(new AuditLogResponse()));

        PagedResponse<AuditLogResponse> response = auditLogService.getLogs(null, null, pageable);

        assertNotNull(response);
        verify(auditLogRepository).findAllByOrderByTimestampDesc(pageable);
    }

    @Test
    void log_ExplicitUsernameAndUserId_SavesExactDetails() {
        UUID userId = UUID.randomUUID();
        auditLogService.log("admin", userId, AuditAction.UPDATE, AuditEntityType.USER, "u-1", "Frissítés");

        verify(auditLogRepository).save(argThat(log -> "admin".equals(log.getUsername()) &&
                userId.equals(log.getUserId()) &&
                log.getAction() == AuditAction.UPDATE &&
                log.getEntityType() == AuditEntityType.USER &&
                "u-1".equals(log.getEntityId())));
    }

    @Test
    void log_WithSecurityContext_ExtractsUserFromAuth() {
        UUID userId = UUID.randomUUID();
        hu.mes.backend.models.User testUser = hu.mes.backend.models.User.builder()
                .name("loggedUser")
                .roles(Collections.emptySet())
                .build();
        testUser.setId(userId);
        CustomUserDetails userDetails = new CustomUserDetails(testUser);

        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getName()).thenReturn("loggedUser");
        when(auth.getPrincipal()).thenReturn(userDetails);

        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        auditLogService.log(AuditAction.DELETE, AuditEntityType.PRODUCT, "SKU-99", "Termék törölve");

        verify(auditLogRepository).save(argThat(log -> "loggedUser".equals(log.getUsername()) &&
                userId.equals(log.getUserId())));
    }

    @Test
    void log_WithoutSecurityContext_DefaultsToSystem() {
        SecurityContextHolder.clearContext();

        auditLogService.log(AuditAction.STATUS_CHANGE, AuditEntityType.MACHINE, "M-01", "Gép leállt");

        verify(auditLogRepository).save(argThat(log -> "SYSTEM".equals(log.getUsername()) &&
                log.getUserId() == null));
    }
}
