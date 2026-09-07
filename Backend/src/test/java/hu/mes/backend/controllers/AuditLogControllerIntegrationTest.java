/*
================================================================
Ez a fájl mesterséges intelligencia segítségével íródott. 
================================================================
*/
package hu.mes.backend.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.web.servlet.MockMvc;

import hu.mes.backend.dtos.audit.AuditLogResponse;
import hu.mes.backend.dtos.common.PagedResponse;
import hu.mes.backend.exceptions.GlobalExceptionHandler;
import hu.mes.backend.models.enums.AuditAction;
import hu.mes.backend.models.enums.AuditEntityType;
import hu.mes.backend.security.CustomUserDetailsService;
import hu.mes.backend.security.JwtAuthenticationFilter;
import hu.mes.backend.security.JwtUtils;
import hu.mes.backend.services.AuditLogService;

@WebMvcTest(controllers = AuditLogController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
public class AuditLogControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

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

    @Test
    void getAllLogs_ReturnsPagedAuditLogs() throws Exception {
        AuditLogResponse logResponse = new AuditLogResponse();
        logResponse.setUsername("operator1");
        logResponse.setAction(AuditAction.LOGIN);
        logResponse.setEntityType(AuditEntityType.USER);
        logResponse.setDetails("Sikeres bejelentkezés");

        Page<AuditLogResponse> page = new PageImpl<>(List.of(logResponse));
        PagedResponse<AuditLogResponse> pagedResponse = PagedResponse.of(page, List.of(logResponse));

        when(auditLogService.getLogs(any(), any(), any(Pageable.class))).thenReturn(pagedResponse);

        mockMvc.perform(get("/api/audit")
                .param("page", "0")
                .param("size", "15"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].username").value("operator1"))
                .andExpect(jsonPath("$.content[0].action").value("LOGIN"));
    }

    @Test
    void getAllLogs_WithFilters_ReturnsFilteredLogs() throws Exception {
        AuditLogResponse logResponse = new AuditLogResponse();
        logResponse.setUsername("admin");
        logResponse.setAction(AuditAction.CREATE);
        logResponse.setEntityType(AuditEntityType.PRODUCT);

        Page<AuditLogResponse> page = new PageImpl<>(List.of(logResponse));
        PagedResponse<AuditLogResponse> pagedResponse = PagedResponse.of(page, List.of(logResponse));

        when(auditLogService.getLogs(eq(AuditEntityType.PRODUCT), eq(AuditAction.CREATE), any(Pageable.class)))
                .thenReturn(pagedResponse);

        mockMvc.perform(get("/api/audit")
                .param("entityType", "PRODUCT")
                .param("action", "CREATE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].entityType").value("PRODUCT"))
                .andExpect(jsonPath("$.content[0].action").value("CREATE"));
    }
}
