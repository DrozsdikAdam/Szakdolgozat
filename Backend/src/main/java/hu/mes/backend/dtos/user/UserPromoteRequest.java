package hu.mes.backend.dtos.user;

import java.util.Set;

import hu.mes.backend.models.enums.RolesEnum;
import jakarta.validation.constraints.NotEmpty;
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
public class UserPromoteRequest {
    @NotEmpty(message = "A szerepkörök megadása kötelező!")
    private Set<RolesEnum> roles;
}
