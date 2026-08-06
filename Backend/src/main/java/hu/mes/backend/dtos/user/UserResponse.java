package hu.mes.backend.dtos.user;

import java.util.Set;
import java.util.UUID;

import hu.mes.backend.models.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class UserResponse {
    private UUID id;
    private String username;
    private String email;
    private String phoneNumber;
    private Boolean active;
    private Set<Role> roles;
}
