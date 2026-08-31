import type { InventoryResponse, InventoryUpdateRequest } from "../types/inventory/inventory";
import { apiFetch } from "../utils/apiFetch";
import type { PagedResponse } from "../types/common/PagedResponse";

export const getInventories = async (page: number = 0, size: number = 10): Promise<PagedResponse<InventoryResponse>> => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("size", size.toString());
    return apiFetch<PagedResponse<InventoryResponse>>(`api/inventory?${params.toString()}`);
};

export const getInventoryByProductId = async (productId: string): Promise<InventoryResponse> => {
    return apiFetch<InventoryResponse>(`api/inventory/product/${productId}`);
};

export const adjustStock = async (request: InventoryUpdateRequest): Promise<InventoryResponse> => {
    return apiFetch<InventoryResponse>("api/inventory/adjust", {
        method: "POST",
        body: JSON.stringify(request)
    });
};

export const reserveStock = async (request: InventoryUpdateRequest): Promise<InventoryResponse> => {
    return apiFetch<InventoryResponse>("api/inventory/reserve", {
        method: "POST",
        body: JSON.stringify(request)
    });
};

export const consumeStock = async (request: InventoryUpdateRequest): Promise<InventoryResponse> => {
    return apiFetch<InventoryResponse>("api/inventory/consume", {
        method: "POST",
        body: JSON.stringify(request)
    });
};

export const releaseStock = async (request: InventoryUpdateRequest): Promise<InventoryResponse> => {
    return apiFetch<InventoryResponse>("api/inventory/release", {
        method: "POST",
        body: JSON.stringify(request)
    });
};
