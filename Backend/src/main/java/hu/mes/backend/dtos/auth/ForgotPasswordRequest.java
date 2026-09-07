package hu.mes.backend.dtos.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
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
public class ForgotPasswordRequest {

    @NotBlank(message = "Az email mező nem lehet üres!")
    @Email(message = "Az email formátuma érvénytelen!")
    @Size(max = 255, message = "Az email legfeljebb 255 karakter hosszú lehet!")
    private String email;

}
