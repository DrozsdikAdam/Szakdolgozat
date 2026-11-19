import type { AuditResponseDto } from "../dtos/audit.dto.js";
import { AuditMapper } from "../mappers/audit.mapper.js";
import { AuditLog } from "../models/AuditLog.js";
import type { AuditAction, AuditStatus } from "../types/Audit.types.js";

export class AuditService {
    private auditMapper: AuditMapper

    constructor() {
        this.auditMapper = new AuditMapper;
    }

    logAudit = async (action: AuditAction, details: string, status: AuditStatus = 'SUCCESS'): Promise<AuditLog> => {
        return await AuditLog.create({
            id: crypto.randomUUID(),
            action: action,
            details: details,
            status: status,
            createdAt: new Date(),
        })
    }

    getAuditLogs = async (limit = 50): Promise<AuditResponseDto[]> => {
        try {
            const logs = await AuditLog.findAll({
                limit,
                order: [
                    ['createdAt', 'DESC']
                ]
            });

            return this.auditMapper.mapToDtos(logs);
        } catch (error) {
            console.error('Error getting audit logs:', error);
            throw error;
        }
    }
}