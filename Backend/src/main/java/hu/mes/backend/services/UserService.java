package hu.mes.backend.services;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;

import hu.mes.backend.dtos.user.UserResponse;
import hu.mes.backend.mappers.UserMapper;
import hu.mes.backend.models.User;
import hu.mes.backend.models.enums.RolesEnum;
import hu.mes.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    public List<UserResponse> getAllUsers() {
        return userMapper.convertToResponses(userRepository.findAll());
    }

    public List<UserResponse> getAssignableUsers() {
        Set<User> usersSet = new HashSet<>(userRepository.findByActiveTrueAndRoles_Name(RolesEnum.OPERATOR));
        usersSet.addAll(userRepository.findByActiveTrueAndRoles_Name(RolesEnum.MANAGER));
        return userMapper.convertToResponses(new ArrayList<>(usersSet));
    }

}
