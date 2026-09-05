package hu.mes.backend.dtos.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResetPasswordRequest {

    @NotBlank(message = "A token mező nem lehet üres!")
    private String token;

    @NotBlank(message = "A jelszó kitöltése kötelező")
    @Size(min = 8, message = "A jelszónak legalább 8 karakterből kell állnia")
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,}$", message = "A jelszónak tartalmaznia kell legalább 1 betűt, 1 számot és 1 speciális karaktert")
    private String newPassword;

}
