import type { InventoryResponse, InventoryUpdateRequest } from "../types/inventory";
import { apiFetch } from "../utils/apiFetch";

export const getAllInventories = async (): Promise<InventoryResponse[]> => {
    return apiFetch<InventoryResponse[]>("api/inventory");
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
