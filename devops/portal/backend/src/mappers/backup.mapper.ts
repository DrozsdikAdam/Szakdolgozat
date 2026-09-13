import type { BackupResponseDto } from "../dtos/backup.dto.js";
import type { BackupRecord } from "../models/BackupRecords.js";

export class BackupMapper {

    mapToDto(entity: BackupRecord): BackupResponseDto {
        return {
            id: entity.id,
            filename: entity.filename,
            size: Number(entity.sizeBytes),
            status: entity.status,
            s3Path: entity.s3Path,
            createdAt: entity.createdAt.toISOString(),
            updatedAt: entity.updatedAt.toISOString()
        };
    }

    mapToDtos(entities: BackupRecord[]): BackupResponseDto[] {
        return entities.map(entity => this.mapToDto(entity));
    }

}