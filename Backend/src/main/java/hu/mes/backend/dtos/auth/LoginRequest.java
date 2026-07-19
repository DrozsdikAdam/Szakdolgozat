package hu.mes.backend.dtos.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    @NotBlank(message = "A felhasználónév kitöltése kötelező")
    @Pattern(regexp = "^[a-zA-Z0-9]+$", message = "A felhasználónév csak betűket és számokat tartalmazhat")
    private String username;

    @NotBlank(message = "A jelszó kitöltése kötelező")
    @Size(min = 8, message = "A jelszónak legalább 8 karakterből kell állnia")
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,}$", message = "A jelszónak tartalmaznia kell legalább 1 betűt, 1 számot és 1 speciális karaktert")
    private String password;
}
