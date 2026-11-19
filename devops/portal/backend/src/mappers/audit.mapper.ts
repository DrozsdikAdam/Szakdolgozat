import type { AuditLog } from "../models/AuditLog.js";
import type { AuditResponseDto } from "../dtos/audit.dto.js";

export class AuditMapper {

    mapToDto(entity: AuditLog): AuditResponseDto {
        return {
            id: entity.id,
            action: entity.action,
            details: entity.details,
            status: entity.status,
            createdAt: entity.createdAt.toISOString()
        };
    }

    mapToDtos(entities: AuditLog[]): AuditResponseDto[] {
        return entities.map(entity => this.mapToDto(entity));
    }

}