import type { ApiResponse } from "../types/api";

export const apiClient = async <T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: unknown
): Promise<ApiResponse<T>> => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const url = `${baseUrl}${endpoint}`;
    const response = await fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const json = await response.json() as ApiResponse<T>

    if (!response.ok || !json.success)
        throw new Error(json.message || json.error);

    return json;
}