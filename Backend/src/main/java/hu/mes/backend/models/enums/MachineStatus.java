package hu.mes.backend.models.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Getter
public enum MachineStatus {
    RUNNING("Aktív"),
    IDLE("Tétlen"),
    ERROR("Hiba"),
    STOPPED("Leállítva"),
    MAINTENANCE("Karbantartás"),
    OFFLINE("Kikapcsolva");

    private final String displayValue;

}
