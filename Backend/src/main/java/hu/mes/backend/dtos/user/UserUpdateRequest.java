package hu.mes.backend.dtos.user;

import java.util.Set;

import hu.mes.backend.models.enums.RolesEnum;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class UserUpdateRequest {
    @NotBlank
    @Size(min = 3, max = 50, message = "A felhasználónévnek legalább 3, de legfeljebb 50 karakternek kell lennie!")
    private String username;
    @NotBlank(message = "Az email cím megadása kötelező!")
    @Email(message = "Érvényes email címet adjon meg!")
    private String email;
    @Size(max = 20, message = "A telefonszámnak maximum 20 karakteresnek kell lennie!")
    @Pattern(regexp = "^[0-9+ \\\\-]+$", message = "A telefonszám csak számokat, pluszt, szóközt és kötőjelet tartalmazhat")
    private String phoneNumber;
    @NotEmpty(message = "A szerepkörök megadása kötelező!")
    private Set<RolesEnum> roles;
    private Boolean active;
}
