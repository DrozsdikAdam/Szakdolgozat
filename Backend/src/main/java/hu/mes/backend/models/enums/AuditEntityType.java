package hu.mes.backend.models.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AuditEntityType {
    USER("user"),
    MACHINE("machine"),
    WORKORDER("workorder"),
    MAINTENANCE("maintenance"),
    INVENTORY("inventory"),
    PRODUCT("product"),
    BOM("bom"),
    AUTHENTICATION("authentication"),
    SECURITY("security");

    private final String entityType;
}
