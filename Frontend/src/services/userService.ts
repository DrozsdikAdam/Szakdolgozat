import type { UserCreateRequest, UserResponse, UserUpdateRequest } from "../types/user/User";
import { apiFetch } from "../utils/apiFetch";

export const getUsers = async (): Promise<UserResponse[]> => {
    return apiFetch<UserResponse[]>("api/users");
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
