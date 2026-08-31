import type { UserCreateRequest, UserResponse, UserUpdateRequest } from "../types/user/User";
import { apiFetch } from "../utils/apiFetch";
import type { PagedResponse } from "../types/common/PagedResponse";

export const getUsers = async (page: number = 0, size: number = 10): Promise<PagedResponse<UserResponse>> => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("size", size.toString());
    return apiFetch<PagedResponse<UserResponse>>(`api/users?${params.toString()}`);
};

export const getUserById = async (id: string): Promise<UserResponse> => {
    return apiFetch<UserResponse>(`api/users/${id}`);
};

export const createUser = async (request: UserCreateRequest): Promise<UserResponse> => {
    return apiFetch<UserResponse>("api/users", {
        method: "POST",
        body: JSON.stringify(request)
    });
};

export const updateUser = async (id: string, request: UserUpdateRequest): Promise<UserResponse> => {
    return apiFetch<UserResponse>(`api/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(request)
    });
};

export const getAssignableUsers = async (): Promise<UserResponse[]> => {
    return apiFetch<UserResponse[]>("api/users/assignable");
};

export const toggleUserStatus = async (id: string): Promise<UserResponse> => {
    return apiFetch<UserResponse>(`api/users/${id}/toggle-status`, {
        method: "PATCH"
    });
};

export const promoteUser = async (id: string, roles: string[]): Promise<UserResponse> => {
    return apiFetch<UserResponse>(`api/users/${id}/promote`, {
        method: "PATCH",
        body: JSON.stringify({ roles })
    });
};
