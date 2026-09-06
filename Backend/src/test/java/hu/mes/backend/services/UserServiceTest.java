/*
================================================================
Ez a fájl mesterséges intelligencia segítségével íródott. 
================================================================
*/
package hu.mes.backend.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

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
import org.springframework.security.crypto.password.PasswordEncoder;

import hu.mes.backend.dtos.common.PagedResponse;
import hu.mes.backend.dtos.user.UserCreateRequest;
import hu.mes.backend.dtos.user.UserPromoteRequest;
import hu.mes.backend.dtos.user.UserResponse;
import hu.mes.backend.dtos.user.UserUpdateRequest;
import hu.mes.backend.mappers.UserMapper;
import hu.mes.backend.models.Role;
import hu.mes.backend.models.User;
import hu.mes.backend.models.enums.AuditAction;
import hu.mes.backend.models.enums.AuditEntityType;
import hu.mes.backend.models.enums.RolesEnum;
import hu.mes.backend.repositories.RoleRepository;
import hu.mes.backend.repositories.UserRepository;
import jakarta.persistence.EntityNotFoundException;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @InjectMocks
    private UserService userService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserMapper userMapper;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuditLogService auditLogService;

    private User user;
    private Role operatorRole;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        operatorRole = new Role();
        operatorRole.setName(RolesEnum.OPERATOR);

        user = User.builder()
                .name("testuser")
                .email("test@mes.hu")
                .phoneNumber("+36301234567")
                .roles(Set.of(operatorRole))
                .active(true)
                .build();
        user.setId(userId);
    }

    @Test
    void getAllUsers_ReturnsPagedResponse() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<User> page = new PageImpl<>(List.of(user));
        when(userRepository.findAll(pageable)).thenReturn(page);
        when(userMapper.convertToResponses(List.of(user))).thenReturn(List.of(new UserResponse()));

        PagedResponse<UserResponse> result = userService.getAllUsers(pageable);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
    }

    @Test
    void getUserById_Success() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userMapper.convertToResponse(user)).thenReturn(new UserResponse());

        UserResponse response = userService.getUserById(userId);

        assertNotNull(response);
    }

    @Test
    void getUserById_NotFound_ThrowsEntityNotFoundException() {
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> userService.getUserById(userId));
    }

    @Test
    void getAssignableUsers_Success() {
        when(userRepository.findByActiveTrueAndRoles_Name(RolesEnum.OPERATOR)).thenReturn(List.of(user));
        when(userRepository.findByActiveTrueAndRoles_Name(RolesEnum.MANAGER)).thenReturn(List.of());
        when(userMapper.convertToResponses(any())).thenReturn(List.of(new UserResponse()));

        List<UserResponse> list = userService.getAssignableUsers();

        assertNotNull(list);
        assertEquals(1, list.size());
    }

    @Test
    void createUser_Success() {
        UserCreateRequest request = new UserCreateRequest();
        request.setUsername("ujuser");
        request.setEmail("uj@mes.hu");
        request.setPassword("titok123");
        request.setPhoneNumber("+36309876543");
        request.setRoles(Set.of(RolesEnum.OPERATOR));

        when(userRepository.findByEmailAndActiveTrue("uj@mes.hu")).thenReturn(Optional.empty());
        when(userRepository.findByNameAndActiveTrue("ujuser")).thenReturn(Optional.empty());
        when(roleRepository.findByName(RolesEnum.OPERATOR)).thenReturn(Optional.of(operatorRole));
        when(passwordEncoder.encode("titok123")).thenReturn("hashedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });
        when(userMapper.convertToResponse(any())).thenReturn(new UserResponse());

        UserResponse response = userService.createUser(request);

        assertNotNull(response);
        verify(userRepository).save(any(User.class));
        verify(auditLogService).log(eq(AuditAction.CREATE), eq(AuditEntityType.USER), eq("ujuser"), any());
    }

    @Test
    void createUser_NullRequest_ThrowsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class, () -> userService.createUser(null));
        verify(userRepository, never()).save(any());
    }

    @Test
    void createUser_EmailAlreadyExists_ThrowsIllegalArgumentException() {
        UserCreateRequest request = new UserCreateRequest();
        request.setEmail("test@mes.hu");

        when(userRepository.findByEmailAndActiveTrue("test@mes.hu")).thenReturn(Optional.of(user));

        assertThrows(IllegalArgumentException.class, () -> userService.createUser(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    void createUser_UsernameAlreadyExists_ThrowsIllegalArgumentException() {
        UserCreateRequest request = new UserCreateRequest();
        request.setEmail("unique@mes.hu");
        request.setUsername("testuser");

        when(userRepository.findByEmailAndActiveTrue("unique@mes.hu")).thenReturn(Optional.empty());
        when(userRepository.findByNameAndActiveTrue("testuser")).thenReturn(Optional.of(user));

        assertThrows(IllegalArgumentException.class, () -> userService.createUser(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    void updateUser_Success() {
        UserUpdateRequest request = new UserUpdateRequest();
        request.setUsername("modositottUser");
        request.setEmail("modositott@mes.hu");
        request.setPhoneNumber("+36301112233");
        request.setActive(true);
        request.setRoles(Set.of(RolesEnum.OPERATOR));

        when(userRepository.findByEmailAndActiveTrue("modositott@mes.hu")).thenReturn(Optional.empty());
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(roleRepository.findByName(RolesEnum.OPERATOR)).thenReturn(Optional.of(operatorRole));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));
        when(userMapper.convertToResponse(any())).thenReturn(new UserResponse());

        UserResponse response = userService.updateUser(userId, request);

        assertNotNull(response);
        assertEquals("modositottUser", user.getName());
        assertEquals("modositott@mes.hu", user.getEmail());
        verify(auditLogService).log(eq(AuditAction.UPDATE), eq(AuditEntityType.USER), eq("modositottUser"), any());
    }

    @Test
    void updateUser_EmailTakenByAnotherUser_ThrowsIllegalArgumentException() {
        User otherUser = new User();
        otherUser.setId(UUID.randomUUID());

        UserUpdateRequest request = new UserUpdateRequest();
        request.setEmail("taken@mes.hu");

        when(userRepository.findByEmailAndActiveTrue("taken@mes.hu")).thenReturn(Optional.of(otherUser));

        assertThrows(IllegalArgumentException.class, () -> userService.updateUser(userId, request));
        verify(userRepository, never()).save(any());
    }

    @Test
    void promoteUser_Success() {
        UserPromoteRequest request = new UserPromoteRequest();
        request.setRoles(Set.of(RolesEnum.OPERATOR));

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(roleRepository.findByName(RolesEnum.OPERATOR)).thenReturn(Optional.of(operatorRole));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));
        when(userMapper.convertToResponse(any())).thenReturn(new UserResponse());

        UserResponse response = userService.promoteUser(userId, request);

        assertNotNull(response);
        verify(auditLogService).log(eq(AuditAction.UPDATE), eq(AuditEntityType.USER), eq("testuser"), any());
    }

    @Test
    void toggleUserStatus_FlipsActiveState() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));
        when(userMapper.convertToResponse(any())).thenReturn(new UserResponse());

        userService.toggleUserStatus(userId);

        assertFalse(user.isActive());
        verify(auditLogService).log(eq(AuditAction.STATUS_CHANGE), eq(AuditEntityType.USER), eq("testuser"), any());
    }
}
