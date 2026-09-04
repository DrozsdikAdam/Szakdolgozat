import type { InventoryResponse, InventoryUpdateRequest } from "../types/inventory/inventory";
import type { PagedResponse } from "../types/common/PagedResponse";
import { offlineDb } from "./offlineDb";
import type { CachedInventory } from "../types/offline/offline";
import { fetchPagedWithOfflineCache, fetchItemWithOfflineCache, mutateWithOfflineQueue } from "../utils/offlineHelper";

const mapCachedToInventoryResponse = (item: CachedInventory): InventoryResponse => ({
    id: item.id,
    productId: item.productId,
    productName: item.productName,
    productSku: item.productSku,
    quantity: item.quantity,
    reservedQuantity: item.reservedQuantity,
    location: item.location,
    updatedAt: item.updatedAt || new Date(item.lastUpdated).toISOString()
});

const mapResponseToCache = (r: InventoryResponse): CachedInventory => ({
    id: r.id,
    productId: r.productId,
    productName: r.productName,
    productSku: r.productSku,
    quantity: r.quantity,
    reservedQuantity: r.reservedQuantity,
    location: r.location,
    updatedAt: r.updatedAt,
    lastUpdated: Date.now()
});

export const getInventories = async (page: number = 0, size: number = 10): Promise<PagedResponse<InventoryResponse>> => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    return fetchPagedWithOfflineCache({
        url: `/api/inventory?${params.toString()}`,
        table: offlineDb.cachedInventories,
        mapToResponse: mapCachedToInventoryResponse,
        mapToCache: mapResponseToCache
    });
};

export const getInventoryByProductId = async (productId: string): Promise<InventoryResponse> => {
    return fetchItemWithOfflineCache({
        url: `/api/inventory/product/${productId}`,
        getCached: () => offlineDb.cachedInventories.where("productId").equals(productId).first(),
        mapToResponse: mapCachedToInventoryResponse,
        mapToCache: mapResponseToCache,
        saveToCache: (item) => offlineDb.cachedInventories.put(item)
    });
};

export const adjustStock = async (request: InventoryUpdateRequest): Promise<InventoryResponse> => {
    return mutateWithOfflineQueue<InventoryResponse>({
        url: "/api/inventory/adjust",
        method: "POST",
        payload: request,
        actionType: "QUANTITY_REPORT",
        entityName: "Készletkorrekció",
        applyOptimistic: async () => {
            const existing = await offlineDb.cachedInventories.where("productId").equals(request.productId).first();
            if (existing) {
                const newQty = existing.quantity + request.amount;
                await offlineDb.cachedInventories.update(existing.id, {
                    quantity: newQty,
                    lastUpdated: Date.now(),
                    location: request.location || existing.location
                });
                return { ...existing, quantity: newQty, location: request.location || existing.location };
            }
            return {
                id: crypto.randomUUID(),
                productId: request.productId,
                productName: "Helyi készlet",
                productSku: "",
                quantity: request.amount,
                reservedQuantity: 0,
                location: request.location || null,
                updatedAt: new Date().toISOString()
            } as InventoryResponse;
        },
        onSuccess: async (res) => {
            await offlineDb.cachedInventories.put(mapResponseToCache(res));
        }
    });
};

export const reserveStock = async (request: InventoryUpdateRequest): Promise<InventoryResponse> => {
    return mutateWithOfflineQueue<InventoryResponse>({
        url: "/api/inventory/reserve",
        method: "POST",
        payload: request,
        actionType: "QUANTITY_REPORT",
        entityName: "Készlet zárolás",
        applyOptimistic: async () => {
            const existing = await offlineDb.cachedInventories.where("productId").equals(request.productId).first();
            if (existing) {
                const newReserved = existing.reservedQuantity + request.amount;
                await offlineDb.cachedInventories.update(existing.id, {
                    reservedQuantity: newReserved,
                    lastUpdated: Date.now()
                });
                return { ...existing, reservedQuantity: newReserved };
            }
            return {
                id: crypto.randomUUID(),
                productId: request.productId,
                productName: "Helyi készlet",
                productSku: "",
                quantity: 0,
                reservedQuantity: request.amount,
                location: null,
                updatedAt: new Date().toISOString()
            } as InventoryResponse;
        },
        onSuccess: async (res) => {
            await offlineDb.cachedInventories.put(mapResponseToCache(res));
        }
    });
};

export const consumeStock = async (request: InventoryUpdateRequest): Promise<InventoryResponse> => {
    return mutateWithOfflineQueue<InventoryResponse>({
        url: "/api/inventory/consume",
        method: "POST",
        payload: request,
        actionType: "QUANTITY_REPORT",
        entityName: "Anyagfelhasználás",
        applyOptimistic: async () => {
            const existing = await offlineDb.cachedInventories.where("productId").equals(request.productId).first();
            if (existing) {
                const newQty = Math.max(0, existing.quantity - request.amount);
                const newReserved = Math.max(0, existing.reservedQuantity - request.amount);
                await offlineDb.cachedInventories.update(existing.id, {
                    quantity: newQty,
                    reservedQuantity: newReserved,
                    lastUpdated: Date.now()
                });
                return { ...existing, quantity: newQty, reservedQuantity: newReserved };
            }
            return {
                id: crypto.randomUUID(),
                productId: request.productId,
                productName: "Helyi készlet",
                productSku: "",
                quantity: 0,
                reservedQuantity: 0,
                location: null,
                updatedAt: new Date().toISOString()
            } as InventoryResponse;
        },
        onSuccess: async (res) => {
            await offlineDb.cachedInventories.put(mapResponseToCache(res));
        }
    });
};

export const releaseStock = async (request: InventoryUpdateRequest): Promise<InventoryResponse> => {
    return mutateWithOfflineQueue<InventoryResponse>({
        url: "/api/inventory/release",
        method: "POST",
        payload: request,
        actionType: "QUANTITY_REPORT",
        entityName: "Készlet feloldás",
        applyOptimistic: async () => {
            const existing = await offlineDb.cachedInventories.where("productId").equals(request.productId).first();
            if (existing) {
                const newReserved = Math.max(0, existing.reservedQuantity - request.amount);
                await offlineDb.cachedInventories.update(existing.id, {
                    reservedQuantity: newReserved,
                    lastUpdated: Date.now()
                });
                return { ...existing, reservedQuantity: newReserved };
            }
            return {
                id: crypto.randomUUID(),
                productId: request.productId,
                productName: "Helyi készlet",
                productSku: "",
                quantity: 0,
                reservedQuantity: 0,
                location: null,
                updatedAt: new Date().toISOString()
            } as InventoryResponse;
        },
        onSuccess: async (res) => {
            await offlineDb.cachedInventories.put(mapResponseToCache(res));
        }
    });
};
