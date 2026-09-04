package hu.mes.backend.models.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AuditAction {

    CREATE("create"),
    UPDATE("update"),
    DELETE("delete"),
    STATUS_CHANGE("status_change"),
    EMERGENCY_STOP("emergency_stop"),
    LOGIN("login"),
    LOGOUT("logout"),
    STOCK_ADJUSTMENT("stock_adjustment"),
    STOCK_RESERVED("stock_reserved"),
    STOCK_CONSUMED("stock_consumed"),
    MAINTENANCE_LOG("maintenance"),
    SECURITY_VIOLATION("security_violation");

    private final String action;
}
