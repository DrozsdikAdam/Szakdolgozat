import { apiFetch } from "../utils/apiFetch";
import type { PagedResponse } from "../types/common/PagedResponse";
import type {
    QuarantineItemResponse,
    ConflictResolutionRequest,
    SyncBatchRequestDto,
    SyncBatchResponseDto
} from "../types/offline/quarantine";

export const quarantineService = {
    getPendingConflicts: async (page: number = 0, size: number = 10): Promise<PagedResponse<QuarantineItemResponse>> => {
        const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
        return await apiFetch<PagedResponse<QuarantineItemResponse>>(`/api/sync/quarantine?${params.toString()}`);
    },

    getAllPendingConflicts: async (): Promise<QuarantineItemResponse[]> => {
        return await apiFetch<QuarantineItemResponse[]>('/api/sync/quarantine/all');
    },

    getPendingConflictCount: async (): Promise<number> => {
        return await apiFetch<number>('/api/sync/quarantine/count');
    },

    getConflictById: async (id: string): Promise<QuarantineItemResponse> => {
        return await apiFetch<QuarantineItemResponse>(`/api/sync/quarantine/${id}`);
    },

    getConflictsByEntity: async (entityName: string, entityId: string): Promise<QuarantineItemResponse[]> => {
        return await apiFetch<QuarantineItemResponse[]>(`/api/sync/quarantine/entity/${entityName}/${entityId}`);
    },

    resolveConflict: async (id: string, request: ConflictResolutionRequest): Promise<QuarantineItemResponse> => {
        return await apiFetch<QuarantineItemResponse>(`/api/sync/quarantine/${id}/resolve`, {
            method: "POST",
            body: JSON.stringify(request)
        });
    },

    discardConflict: async (id: string): Promise<void> => {
        return await apiFetch<void>(`/api/sync/quarantine/${id}`, {
            method: "DELETE"
        });
    },

    processOfflineBatch: async (request: SyncBatchRequestDto): Promise<SyncBatchResponseDto> => {
        return await apiFetch<SyncBatchResponseDto>('/api/sync/offline', {
            method: "POST",
            body: JSON.stringify(request)
        });
    }
};
