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

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class UserCreateRequest {

    @NotBlank(message = "A felhasználónév nem lehet üres!")
    @Size(min = 3, max = 50, message = "A felhasználónévnek legalább 3, de legfeljebb 50 karakternek kell lennie!")
    @Pattern(regexp = "^[a-zA-Z0-9]+$", message = "A felhasználónév csak betűket és számokat tartalmazhat")
    private String username;

    @NotBlank(message = "Az email cím megadása kötelező!")
    @Email(message = "Érvényes email címet adjon meg!")
    private String email;

    @NotBlank(message = "A jelszó megadása kötelező!")
    @Size(min = 8, message = "A jelszónak legalább 8 karakteresnek kell lennie!")
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,}$", message = "A jelszónak tartalmaznia kell legalább 1 betűt, 1 számot és 1 speciális karaktert")
    private String password;

    @Size(max = 20, message = "A telefonszámnak maximum 20 karakteresnek kell lennie!")
    @Pattern(regexp = "^[0-9+ \\\\-]+$", message = "A telefonszám csak számokat, pluszt, szóközt és kötőjelet tartalmazhat")
    private String phoneNumber;

    @NotEmpty(message = "A szerepkörök megadása kötelező!")
    private Set<RolesEnum> roles;

}
