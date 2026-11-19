package hu.mes.backend.models.enums;

import lombok.Getter;

@Getter
public enum QuarantineStatus {
    CONFLICT("Ütközés"),
    RESOLVED("Feloldva"),
    DISCARDED("Elvetve");

    private final String displayName;

    QuarantineStatus(String displayName) {
        this.displayName = displayName;
    }
}
