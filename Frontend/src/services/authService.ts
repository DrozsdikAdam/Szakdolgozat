import { apiFetch } from "../utils/apiFetch";
import type { ForgotPasswordRequest, ResetPasswordRequest } from "../types/auth/auth";

const baseUrl = '/api/auth';

export const requestPasswordReset = async (request: ForgotPasswordRequest): Promise<{ message: string }> => {
    const response = await apiFetch<{ message: string }>(`${baseUrl}/forgot-password`, {
        method: 'POST',
        body: JSON.stringify(request)
    });
    return response;
};

export const resetPassword = async (request: ResetPasswordRequest): Promise<{ message: string }> => {
    const response = await apiFetch<{ message: string }>(`${baseUrl}/reset-password`, {
        method: 'POST',
        body: JSON.stringify(request)
    });
    return response;
};

export const getMe = async () => {
    const response = await apiFetch(`${baseUrl}/me`);
    return response;
};
