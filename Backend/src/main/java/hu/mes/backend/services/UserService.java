package hu.mes.backend.services;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.cache.annotation.CacheConfig;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@CacheConfig(cacheNames = "users")
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    @Cacheable(key = "'all'")
    public PagedResponse<UserResponse> getAllUsers(Pageable pageable) {
        Page<User> page = userRepository.findAll(pageable);
        return PagedResponse.of(page, userMapper.convertToResponses(page.getContent()));
    }

    @Cacheable(key = "#id")
    public UserResponse getUserById(UUID id) {
        return userMapper.convertToResponse(getUserEntityById(id));
    }

    @Cacheable(key = "'assignable'")
    public List<UserResponse> getAssignableUsers() {
        Set<User> usersSet = new HashSet<>(userRepository.findByActiveTrueAndRoles_Name(RolesEnum.OPERATOR));
        usersSet.addAll(userRepository.findByActiveTrueAndRoles_Name(RolesEnum.MANAGER));
        return userMapper.convertToResponses(new ArrayList<>(usersSet));
    }

    @Transactional
    @CacheEvict(allEntries = true)
    public UserResponse createUser(UserCreateRequest request) {
        if (request == null)
            throw new IllegalArgumentException("A felhasználó létrehozásához szükséges adatok nem érvényesek.");

        if (userRepository.findByEmailAndActiveTrue(request.getEmail()).isPresent())
            throw new IllegalArgumentException("A felhasználó e-mail címe már létezik.");

        if (userRepository.findByNameAndActiveTrue(request.getUsername()).isPresent())
            throw new IllegalArgumentException("A felhasználó neve már létezik.");

        Set<Role> roles = resolveRoles(request.getRoles());

        User user = User.builder()
                .name(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .phoneNumber(request.getPhoneNumber())
                .roles(roles)
                .active(true)
                .build();

        User savedUser = userRepository.save(user);
        auditLogService.log(AuditAction.CREATE, AuditEntityType.USER, savedUser.getName(),
                "Új felhasználó létrehozva: " + savedUser.getName() + " (" + savedUser.getEmail() + ")");

        return userMapper.convertToResponse(savedUser);
    }

    @Transactional
    @CacheEvict(allEntries = true)
    public UserResponse updateUser(UUID id, UserUpdateRequest request) {
        if (request == null)
            throw new IllegalArgumentException("A felhasználó frissítéséhez szükséges adatok nem érvényesek.");

        Optional<User> existingWithEmail = userRepository.findByEmailAndActiveTrue(request.getEmail());
        if (existingWithEmail.isPresent() && !existingWithEmail.get().getId().equals(id))
            throw new IllegalArgumentException("A felhasználó e-mail címe már létezik.");

        User user = getUserEntityById(id);
        user.setName(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setActive(request.getActive());
        Set<Role> roles = resolveRoles(request.getRoles());
        user.setRoles(roles);

        User updatedUser = userRepository.save(user);
        auditLogService.log(AuditAction.UPDATE, AuditEntityType.USER, updatedUser.getName(),
                "Felhasználó módosítva: " + updatedUser.getName());

        return userMapper.convertToResponse(updatedUser);
    }

    @Transactional
    @CacheEvict(allEntries = true)
    public UserResponse promoteUser(UUID id, UserPromoteRequest request) {
        User user = getUserEntityById(id);

        Set<Role> roles = resolveRoles(request.getRoles());
        user.setRoles(roles);
        User savedUser = userRepository.save(user);

        auditLogService.log(AuditAction.UPDATE, AuditEntityType.USER, savedUser.getName(),
                "Felhasználó szerepkörei frissítve: " + savedUser.getName());

        return userMapper.convertToResponse(savedUser);
    }

    @Transactional
    @CacheEvict(allEntries = true)
    public UserResponse toggleUserStatus(UUID id) {
        User user = getUserEntityById(id);
        user.setActive(!user.isActive());
        User savedUser = userRepository.save(user);

        auditLogService.log(AuditAction.STATUS_CHANGE, AuditEntityType.USER, savedUser.getName(),
                "Felhasználó státusza megváltoztatva: " + (savedUser.isActive() ? "Aktív" : "Inaktív"));

        return userMapper.convertToResponse(savedUser);
    }

    private Set<Role> resolveRoles(Set<RolesEnum> roleNames) {
        if (roleNames == null || roleNames.isEmpty())
            return new HashSet<>();

        Set<Role> roles = new HashSet<>();
        for (RolesEnum role : roleNames)
            roles.add(roleRepository.findByName(role)
                    .orElseThrow(() -> new EntityNotFoundException("Szerepkör nem található: " + role)));
        return roles;
    }

    private User getUserEntityById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Felhasználó nem található azonosítóval: " + id));
    }

}
