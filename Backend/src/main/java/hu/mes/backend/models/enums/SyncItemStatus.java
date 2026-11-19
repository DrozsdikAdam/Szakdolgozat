package hu.mes.backend.models.enums;

import lombok.Getter;

@Getter
public enum SyncItemStatus {
    APPLIED("Sikeresen alkalmazva"),
    CONFLICT("Karanténba került ütközés miatt"),
    SKIPPED("Már feldolgozva (idempotens)"),
    ERROR("Feldolgozási hiba");

    private final String description;

    SyncItemStatus(String description) {
        this.description = description;
    }
}
