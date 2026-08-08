package hu.mes.backend.services;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import hu.mes.backend.dtos.user.UserCreateRequest;
import hu.mes.backend.dtos.user.UserPromoteRequest;
import hu.mes.backend.dtos.user.UserResponse;
import hu.mes.backend.dtos.user.UserUpdateRequest;
import hu.mes.backend.mappers.UserMapper;
import hu.mes.backend.models.Role;
import hu.mes.backend.models.User;
import hu.mes.backend.models.enums.RolesEnum;
import hu.mes.backend.repositories.RoleRepository;
import hu.mes.backend.repositories.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UserResponse> getAllUsers() {
        return userMapper.convertToResponses(userRepository.findAll());
    }

    public UserResponse getUserById(UUID id) {
        Optional<User> user = userRepository.findById(id);
        if (user.isEmpty()) {
            throw new EntityNotFoundException("Felhasználó nem található azonosítóval: " + id);
        }
        return userMapper.convertToResponse(user.get());
    }

    public List<UserResponse> getAssignableUsers() {
        Set<User> usersSet = new HashSet<>(userRepository.findByActiveTrueAndRoles_Name(RolesEnum.OPERATOR));
        usersSet.addAll(userRepository.findByActiveTrueAndRoles_Name(RolesEnum.MANAGER));
        return userMapper.convertToResponses(new ArrayList<>(usersSet));
    }

    @Transactional
    public UserResponse createUser(UserCreateRequest request) {
        if (request == null)
            throw new IllegalArgumentException("A felhasználó létrehozásához szükséges adatok nem érvényesek.");

        if (userRepository.findByEmailAndActiveTrue(request.getEmail()).isPresent())
            throw new IllegalArgumentException("A felhasználó e-mail címe már létezik.");

        if (userRepository.findByNameAndActiveTrue(request.getUsername()).isPresent())
            throw new IllegalArgumentException("A felhasználó neve már létezik.");

        Set<Role> roles = new HashSet<>();
        for (RolesEnum role : request.getRoles()) {
            roles.add(roleRepository.findByName(role)
                    .orElseThrow(() -> new EntityNotFoundException("Szerepkör nem található: " + role)));
        }

        User user = User.builder()
                .name(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .phoneNumber(request.getPhoneNumber())
                .roles(roles)
                .active(true)
                .build();

        return userMapper.convertToResponse(userRepository.save(user));
    }

    public UserResponse updateUser(UUID id, UserUpdateRequest request) {
        if (request == null)
            throw new IllegalArgumentException("A felhasználó frissítéséhez szükséges adatok nem érvényesek.");

        Optional<User> userOptional = userRepository.findById(id);

        if (userOptional.isEmpty())
            throw new EntityNotFoundException("Felhasználó nem található azonosítóval: " + id);

        if (request.getPhoneNumber() == null)
            throw new IllegalArgumentException("A felhasználó telefonszáma nem lehet üres!");
        else if (request.getPhoneNumber().length() > 20)
            throw new IllegalArgumentException("A felhasználó telefonszáma maximum 20 karakteres lehet!");

        if (request.getEmail() == null)
            throw new IllegalArgumentException("A felhasználó e-mail címe nem lehet üres!");
        else if (userRepository.findByEmailAndActiveTrue(request.getEmail()).isPresent()
                && !userOptional.get().getId().equals(id))
            throw new IllegalArgumentException("A felhasználó e-mail címe már létezik.");

        if (request.getRoles() == null)
            throw new IllegalArgumentException("A felhasználó szerepkörének megadása kötelező!");

        if (request.getActive() == null)
            throw new IllegalArgumentException("A felhasználó státuszának megadása kötelező!");

        User user = userOptional.get();
        user.setName(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setActive(request.getActive());
        Set<Role> roles = new HashSet<>();
        for (RolesEnum role : request.getRoles())
            roles.add(roleRepository.findByName(role)
                    .orElseThrow(() -> new EntityNotFoundException("Szerepkör nem található: " + role)));
        user.setRoles(roles);

        return userMapper.convertToResponse(userRepository.save(user));
    }

    public UserResponse promoteUser(UUID id, UserPromoteRequest request) {
        Optional<User> user = userRepository.findById(id);
        if (user.isEmpty())
            throw new EntityNotFoundException("A megadott azonosítójú felhasználó nem létezik.");

        Set<Role> roles = new HashSet<>();
        for (RolesEnum role : request.getRoles())
            roles.add(roleRepository.findByName(role)
                    .orElseThrow(() -> new EntityNotFoundException("Szerepkör nem található: " + role)));
        user.get().setRoles(roles);
        userRepository.save(user.get());

        return userMapper.convertToResponse(user.get());
    }

    public UserResponse toggleUserStatus(UUID id) {
        Optional<User> userOptional = userRepository.findById(id);
        if (userOptional.isEmpty())
            throw new EntityNotFoundException("A megadott azonosítójú felhasználó nem létezik.");
        User user = userOptional.get();
        user.setActive(!user.isActive());
        userRepository.save(user);
        return userMapper.convertToResponse(user);
    }

}
