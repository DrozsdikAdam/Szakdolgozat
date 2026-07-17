package hu.mes.backend.models;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Getter
public enum RolesEnum {
    SYSTEMADMIN("systemAdmin"),
    OPERATOR("operator"),
    MANAGER("manager"),
    CEO("ceo");

    private final String role;
}
