package hu.mes.backend.mappers;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import hu.mes.backend.dtos.user.UserResponse;
import hu.mes.backend.models.User;
import hu.mes.backend.models.enums.RolesEnum;

@Component
public class UserMapper {
    public UserResponse convertToResponse(User user) {
        Set<RolesEnum> roleEnums = user.getRoles() != null
                ? user.getRoles().stream().map(role -> role.getName()).collect(Collectors.toSet())
                : Set.of();

        return UserResponse.builder()
                .id(user.getId())
                .username(user.getName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .active(user.isActive())
                .roles(roleEnums)
                .build();
    }

    public List<UserResponse> convertToResponses(List<User> users) {
        return users.stream().map(this::convertToResponse).toList();
    }
}
