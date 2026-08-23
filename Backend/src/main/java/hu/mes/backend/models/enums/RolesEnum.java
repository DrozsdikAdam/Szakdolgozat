package hu.mes.backend.models.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Getter
public enum RolesEnum {
    SYSTEMADMIN("systemAdmin"),
    OPERATOR("operator"),
    MANAGER("manager"),
    TECHNICIAN("technician"),
    CEO("ceo");

    private final String role;
}
