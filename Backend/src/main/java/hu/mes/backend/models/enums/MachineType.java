package hu.mes.backend.models.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Getter
public enum MachineType {
    CNC("CNC"),
    INJECTION_MOLDING("Fröccsöntő"),
    ASSEMBLY("Összeszerelő"),
    LASER_CUTTER("Lézer vágó"),
    PACKAGING("Csomagoló"),
    WELDING("Heggesztő"),
    ROBOT("Robotkar");

    private final String type;

}
