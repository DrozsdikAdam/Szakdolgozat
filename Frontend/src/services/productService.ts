import type { ProductResponse, ProductCreateRequest, ProductUpdateRequest } from '../types/product/Product';
import { apiFetch } from '../utils/apiFetch';
import type { PagedResponse } from '../types/common/PagedResponse';
import { offlineDb } from './offlineDb';
import type { CachedProduct } from '../types/offline/offline';
import { fetchPagedWithOfflineCache, fetchItemWithOfflineCache, mutateWithOfflineQueue } from '../utils/offlineHelper';

const mapCachedToProductResponse = (p: CachedProduct): ProductResponse => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    description: p.description,
    unit: p.unit,
    active: p.active,
    createdAt: p.createdAt || new Date(p.lastUpdated).toISOString()
});

const mapResponseToCache = (p: ProductResponse): CachedProduct => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    description: p.description,
    unit: p.unit,
    active: p.active,
    createdAt: p.createdAt,
    lastUpdated: Date.now()
});

export const getProducts = async (page: number = 0, size: number = 10): Promise<PagedResponse<ProductResponse>> => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    return fetchPagedWithOfflineCache({
        url: `/api/products?${params.toString()}`,
        table: offlineDb.cachedProducts,
        mapToResponse: mapCachedToProductResponse,
        mapToCache: mapResponseToCache
    });
};

export const getProductById = async (id: string): Promise<ProductResponse> => {
    return fetchItemWithOfflineCache({
        url: `/api/products/${id}`,
        getCached: () => offlineDb.cachedProducts.get(id),
        mapToResponse: mapCachedToProductResponse,
        mapToCache: mapResponseToCache,
        saveToCache: (item) => offlineDb.cachedProducts.put(item)
    });
};

export const getActiveProducts = async (): Promise<ProductResponse[]> => {
    if (!navigator.onLine) {
        const cached = await offlineDb.cachedProducts.filter(p => p.active).toArray();
        return cached.map(mapCachedToProductResponse);
    }

    try {
        const response = await apiFetch<ProductResponse[]>("/api/products/active");
        if (Array.isArray(response)) {
            await offlineDb.cachedProducts.bulkPut(response.map(mapResponseToCache));
        }
        return response;
    } catch {
        const cached = await offlineDb.cachedProducts.filter(p => p.active).toArray();
        return cached.map(mapCachedToProductResponse);
    }
};

export const getDeletedProducts = async (): Promise<ProductResponse[]> => {
    if (!navigator.onLine) return [];
    try {
        return await apiFetch<ProductResponse[]>("/api/products/deleted");
    } catch {
        return [];
    }
};

export const getInactiveProducts = async (): Promise<ProductResponse[]> => {
    if (!navigator.onLine) {
        const cached = await offlineDb.cachedProducts.filter(p => !p.active).toArray();
        return cached.map(mapCachedToProductResponse);
    }
    try {
        return await apiFetch<ProductResponse[]>("/api/products/inactive");
    } catch {
        const cached = await offlineDb.cachedProducts.filter(p => !p.active).toArray();
        return cached.map(mapCachedToProductResponse);
    }
};

export const createProduct = async (request: ProductCreateRequest): Promise<ProductResponse> => {
    return mutateWithOfflineQueue<ProductResponse>({
        url: "/api/products",
        method: "POST",
        payload: request,
        entityName: `Termék létrehozása: ${request.name}`,
        applyOptimistic: async () => {
            const newProduct: CachedProduct = {
                id: crypto.randomUUID(),
                name: request.name,
                sku: request.sku,
                description: request.description,
                unit: request.unit || "db",
                active: true,
                createdAt: new Date().toISOString(),
                lastUpdated: Date.now()
            };
            await offlineDb.cachedProducts.put(newProduct);
            return mapCachedToProductResponse(newProduct);
        },
        onSuccess: async (res) => {
            await offlineDb.cachedProducts.put(mapResponseToCache(res));
        }
    });
};

export const updateProduct = async (id: string, request: ProductUpdateRequest): Promise<ProductResponse> => {
    return mutateWithOfflineQueue<ProductResponse>({
        url: `/api/products/${id}`,
        method: "PUT",
        payload: request,
        entityName: `Termék szerkesztése: ${request.name || id}`,
        applyOptimistic: async () => {
            const existing = await offlineDb.cachedProducts.get(id);
            const updated: CachedProduct = {
                id,
                name: request.name ?? existing?.name ?? "Termék",
                sku: request.sku ?? existing?.sku ?? "",
                description: request.description ?? existing?.description,
                unit: request.unit ?? existing?.unit ?? "db",
                active: existing?.active ?? true,
                createdAt: existing?.createdAt ?? new Date().toISOString(),
                lastUpdated: Date.now()
            };
            await offlineDb.cachedProducts.put(updated);
            return mapCachedToProductResponse(updated);
        },
        onSuccess: async (res) => {
            await offlineDb.cachedProducts.put(mapResponseToCache(res));
        }
    });
};

export const deleteProduct = async (id: string): Promise<void> => {
    await mutateWithOfflineQueue<void>({
        url: `/api/products/${id}`,
        method: "DELETE",
        payload: null,
        entityName: "Termék törlése",
        applyOptimistic: async () => {
            await offlineDb.cachedProducts.delete(id);
        }
    });
};

export const deactivateProduct = async (id: string): Promise<void> => {
    await mutateWithOfflineQueue<void>({
        url: `/api/products/${id}/deactivate`,
        method: "PUT",
        payload: null,
        entityName: "Termék inaktiválása",
        applyOptimistic: async () => {
            await offlineDb.cachedProducts.update(id, { active: false, lastUpdated: Date.now() });
        }
    });
};

export const activateProduct = async (id: string): Promise<void> => {
    await mutateWithOfflineQueue<void>({
        url: `/api/products/${id}/activate`,
        method: "PUT",
        payload: null,
        entityName: "Termék aktiválása",
        applyOptimistic: async () => {
            await offlineDb.cachedProducts.update(id, { active: true, lastUpdated: Date.now() });
        }
    });
};

export const restoreProduct = async (id: string): Promise<void> => {
    await mutateWithOfflineQueue<void>({
        url: `/api/products/${id}/restore`,
        method: "PUT",
        payload: null,
        entityName: "Termék visszaállítása",
        applyOptimistic: async () => {
            await offlineDb.cachedProducts.update(id, { active: true, lastUpdated: Date.now() });
        }
    });
};