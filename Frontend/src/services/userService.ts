import type { UserCreateRequest, UserResponse, UserUpdateRequest } from "../types/user/User";
import { apiFetch } from "../utils/apiFetch";
import type { PagedResponse } from "../types/common/PagedResponse";

const BASE_URL = "/api/users";

export const getUsers = async (page: number = 0, size: number = 10): Promise<PagedResponse<UserResponse>> => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    return apiFetch<PagedResponse<UserResponse>>(`${BASE_URL}?${params.toString()}`);
};

export const getUserById = async (id: string): Promise<UserResponse> => {
    return apiFetch<UserResponse>(`${BASE_URL}/${id}`);
};

export const createUser = async (request: UserCreateRequest): Promise<UserResponse> => {
    return apiFetch<UserResponse>(BASE_URL, {
        method: "POST",
        body: JSON.stringify(request)
    });
};

export const updateUser = async (id: string, request: UserUpdateRequest): Promise<UserResponse> => {
    return apiFetch<UserResponse>(`${BASE_URL}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(request)
    });
};

export const getAssignableUsers = async (): Promise<UserResponse[]> => {
    if (!navigator.onLine) return [];
    try {
        return await apiFetch<UserResponse[]>(`${BASE_URL}/assignable`);
    } catch {
        return [];
    }
};

export const toggleUserStatus = async (id: string): Promise<UserResponse> => {
    return apiFetch<UserResponse>(`${BASE_URL}/${id}/toggle-status`, {
        method: "PATCH"
    });
};

export const promoteUser = async (id: string, roles: string[]): Promise<UserResponse> => {
    return apiFetch<UserResponse>(`${BASE_URL}/${id}/promote`, {
        method: "PATCH",
        body: JSON.stringify({ roles })
    });
};
