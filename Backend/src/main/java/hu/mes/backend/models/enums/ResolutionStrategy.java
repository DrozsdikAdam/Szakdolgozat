package hu.mes.backend.models.enums;

import lombok.Getter;

@Getter
public enum ResolutionStrategy {
    CLIENT_WINS("Kliens oldali adat felülírása"),
    SERVER_WINS("Szerver oldali állapot megőrzése"),
    MANUAL_MERGE("Kézi összefésülés");

    private final String description;

    ResolutionStrategy(String description) {
        this.description = description;
    }
}
