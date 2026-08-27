package hu.mes.backend.models.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Getter
public enum NotificationType {
    INFO("info"),
    WARNING("warning"),
    ERROR("error"),
    SUCCESS("success");

    private final String type;

}
