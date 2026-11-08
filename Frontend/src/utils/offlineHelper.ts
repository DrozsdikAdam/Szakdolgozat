import type { Table } from "dexie";
import type { PagedResponse } from "../types/common/PagedResponse";
import type { OfflineAction } from "../types/offline/offline";
import { apiFetch, ApiError } from "./apiFetch";
import { offlineDb } from "../services/offlineDb";

export const isNetworkError = (error: unknown): boolean => {
    if (!navigator.onLine) return true;
    if (error instanceof ApiError) return false;
    if (typeof error === "object" && error !== null && "status" in error) return false;
    if (error instanceof TypeError) return true;
    if (error instanceof DOMException && error.name === "AbortError") return true;
    return false;
};

export const createOfflinePagedResponse = <T>(
    items: T[],
    pageNumber: number = 0,
    pageSize: number = 10
): PagedResponse<T> => ({
    content: items,
    pageNumber,
    pageSize: items.length || pageSize,
    totalElements: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / (pageSize || 1))),
    first: pageNumber === 0,
    last: true
});

export interface FetchPagedOfflineOptions<TResponse, TCached> {
    url: string;
    table: Table<TCached, any>;
    mapToResponse: (cached: TCached) => TResponse;
    mapToCache: (response: TResponse) => TCached;
}

export const fetchPagedWithOfflineCache = async <TResponse, TCached>(
    options: FetchPagedOfflineOptions<TResponse, TCached>
): Promise<PagedResponse<TResponse>> => {
    const { url, table, mapToResponse, mapToCache } = options;

    if (!navigator.onLine) {
        const cached = await table.toArray();
        return createOfflinePagedResponse(cached.map(mapToResponse));
    }

    try {
        const response = await apiFetch<PagedResponse<TResponse>>(url);
        if (response?.content && Array.isArray(response.content)) {
            const cacheItems = response.content.map(mapToCache);
            await table.bulkPut(cacheItems);
        }
        return response;
    } catch (error) {
        if (isNetworkError(error)) {
            const cached = await table.toArray();
            return createOfflinePagedResponse(cached.map(mapToResponse));
        }
        throw error;
    }
};

export interface FetchItemOfflineOptions<TResponse, TCached> {
    url: string;
    getCached: () => Promise<TCached | undefined>;
    mapToResponse: (cached: TCached) => TResponse;
    mapToCache: (response: TResponse) => TCached;
    saveToCache: (cacheItem: TCached) => Promise<any>;
}

export const fetchItemWithOfflineCache = async <TResponse, TCached>(
    options: FetchItemOfflineOptions<TResponse, TCached>
): Promise<TResponse> => {
    const { url, getCached, mapToResponse, mapToCache, saveToCache } = options;

    if (!navigator.onLine) {
        const cached = await getCached();
        if (cached) return mapToResponse(cached);
    }

    try {
        const response = await apiFetch<TResponse>(url);
        if (response) {
            await saveToCache(mapToCache(response));
        }
        return response;
    } catch (error) {
        if (isNetworkError(error)) {
            const cached = await getCached();
            if (cached) return mapToResponse(cached);
        }
        throw error;
    }
};

export interface MutateOfflineOptions<TResponse> {
    url: string;
    method: "POST" | "PUT" | "PATCH" | "DELETE";
    payload: any;
    actionType?: OfflineAction["type"];
    entityName: string;
    applyOptimistic: () => Promise<TResponse> | TResponse;
    onSuccess?: (response: TResponse) => Promise<void> | void;
}

export const mutateWithOfflineQueue = async <TResponse>(
    options: MutateOfflineOptions<TResponse>
): Promise<TResponse> => {
    const { url, method, payload, actionType = "GENERIC", entityName, applyOptimistic, onSuccess } = options;

    if (!navigator.onLine) {
        await offlineDb.saveOfflineAction(url, method, payload, actionType, entityName);
        return await applyOptimistic();
    }

    try {
        const response = await apiFetch<TResponse>(url, {
            method,
            body: payload !== null && payload !== undefined ? JSON.stringify(payload) : undefined
        });
        if (onSuccess && response) {
            await onSuccess(response);
        }
        return response;
    } catch (error) {
        if (isNetworkError(error)) {
            await offlineDb.saveOfflineAction(url, method, payload, actionType, entityName);
            return await applyOptimistic();
        }
        throw error;
    }
};

