package hu.mes.backend.mappers;

import java.util.List;

import org.springframework.stereotype.Component;

import hu.mes.backend.dtos.user.UserResponse;
import hu.mes.backend.models.User;

@Component
public class UserMapper {
    public UserResponse convertToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .active(user.isActive())
                .roles(user.getRoles())
                .build();
    }

    public List<UserResponse> convertToResponses(List<User> users) {
        return users.stream().map(this::convertToResponse).toList();
    }
}
