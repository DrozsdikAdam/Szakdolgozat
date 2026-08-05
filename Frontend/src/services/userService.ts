import type { UserResponse } from "../types/user/User";
import { apiFetch } from "../utils/apiFetch";

export const getUsers = async (): Promise<UserResponse[]> => {
    return apiFetch<UserResponse[]>("api/users");
};

export const getAssignableUsers = async (): Promise<UserResponse[]> => {
    return apiFetch<UserResponse[]>("api/users/assignable");
};