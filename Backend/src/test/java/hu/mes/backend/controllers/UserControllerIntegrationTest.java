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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
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
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;

import hu.mes.backend.dtos.common.PagedResponse;
import hu.mes.backend.dtos.user.UserCreateRequest;
import hu.mes.backend.dtos.user.UserPromoteRequest;
import hu.mes.backend.dtos.user.UserResponse;
import hu.mes.backend.exceptions.GlobalExceptionHandler;
import hu.mes.backend.models.enums.RolesEnum;
import hu.mes.backend.security.CustomUserDetailsService;
import hu.mes.backend.security.JwtAuthenticationFilter;
import hu.mes.backend.security.JwtUtils;
import hu.mes.backend.services.AuditLogService;
import hu.mes.backend.services.UserService;
import jakarta.persistence.EntityNotFoundException;

@WebMvcTest(controllers = UserController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
public class UserControllerIntegrationTest {

        @Autowired
        private MockMvc mockMvc;

        private ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

        @MockitoBean
        private UserService userService;

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

        private UUID userId;
        private UserResponse userResponse;

        @BeforeEach
        void setUp() {
                userId = UUID.randomUUID();

                userResponse = new UserResponse();
                userResponse.setId(userId);
                userResponse.setUsername("kovacs.bela");
                userResponse.setEmail("bela@mes.hu");
                userResponse.setActive(true);
        }

        @Test
        void getAllUsers_ReturnsPagedUsers() throws Exception {
                Page<UserResponse> page = new PageImpl<>(List.of(userResponse));
                PagedResponse<UserResponse> pagedResponse = PagedResponse.of(page, List.of(userResponse));

                when(userService.getAllUsers(any(Pageable.class))).thenReturn(pagedResponse);

                mockMvc.perform(get("/api/users")
                                .param("page", "0")
                                .param("size", "10"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content[0].username").value("kovacs.bela"));
        }

        @Test
        void getUserById_Success() throws Exception {
                when(userService.getUserById(userId)).thenReturn(userResponse);

                mockMvc.perform(get("/api/users/{id}", userId))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.id").value(userId.toString()))
                                .andExpect(jsonPath("$.username").value("kovacs.bela"));
        }

        @Test
        void getUserById_NotFound_Returns404() throws Exception {
                when(userService.getUserById(userId))
                                .thenThrow(new EntityNotFoundException("Felhasználó nem található"));

                mockMvc.perform(get("/api/users/{id}", userId))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.message").value("Felhasználó nem található"));
        }

        @Test
        void createUser_Success_Returns201() throws Exception {
                UserCreateRequest request = UserCreateRequest.builder()
                                .username("uj.felhasznalo")
                                .email("uj@mes.hu")
                                .password("Biztonsagos1@")
                                .phoneNumber("+36301234567")
                                .roles(Set.of(RolesEnum.OPERATOR))
                                .build();

                when(userService.createUser(any(UserCreateRequest.class))).thenReturn(userResponse);

                mockMvc.perform(post("/api/users")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.username").value("kovacs.bela"));
        }

        @Test
        void createUser_InvalidEmail_Returns400() throws Exception {
                UserCreateRequest request = UserCreateRequest.builder()
                                .username("uj.felhasznalo")
                                .email("ervenytelen-email")
                                .password("Biztonsagos1@")
                                .roles(Set.of(RolesEnum.OPERATOR))
                                .build();

                mockMvc.perform(post("/api/users")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest());
        }

        @Test
        void toggleUserStatus_Success_ReturnsUpdatedUser() throws Exception {
                userResponse.setActive(false);
                when(userService.toggleUserStatus(userId)).thenReturn(userResponse);

                mockMvc.perform(patch("/api/users/{id}/toggle-status", userId))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.active").value(false));
        }

        @Test
        void promoteUser_Success() throws Exception {
                UserPromoteRequest request = new UserPromoteRequest();
                request.setRoles(Set.of(RolesEnum.MANAGER));

                when(userService.promoteUser(eq(userId), any(UserPromoteRequest.class))).thenReturn(userResponse);

                mockMvc.perform(patch("/api/users/{id}/promote", userId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk());
        }
}
