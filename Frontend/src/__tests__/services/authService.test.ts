// Ez a teszt mesterséges intelligencia segítségével jön létre
import { describe, it, expect, vi, beforeEach } from "vitest";
import { requestPasswordReset, resetPassword, getMe } from "../../services/authService";
import { apiFetch } from "../../utils/apiFetch";
import type { UserResponse } from "../../types/user/User";

vi.mock("../../utils/apiFetch", () => ({
    apiFetch: vi.fn()
}));

const mockApiFetch = vi.mocked(apiFetch);

describe("authService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("requestPasswordReset calls POST /api/auth/forgot-password with payload", async () => {
        const mockResponse = { message: "Email sent" };
        mockApiFetch.mockResolvedValueOnce(mockResponse);

        const req = { email: "test@example.com" };
        const result = await requestPasswordReset(req);

        expect(result).toEqual(mockResponse);
        expect(mockApiFetch).toHaveBeenCalledWith("/api/auth/forgot-password", {
            method: "POST",
            body: JSON.stringify(req)
        });
    });

    it("resetPassword calls POST /api/auth/reset-password with payload", async () => {
        const mockResponse = { message: "Password updated successfully" };
        mockApiFetch.mockResolvedValueOnce(mockResponse);

        const req = { token: "secret-token", newPassword: "NewSecretPassword123!" };
        const result = await resetPassword(req);

        expect(result).toEqual(mockResponse);
        expect(mockApiFetch).toHaveBeenCalledWith("/api/auth/reset-password", {
            method: "POST",
            body: JSON.stringify(req)
        });
    });

    it("getMe calls GET /api/auth/me", async () => {
        const mockUser: UserResponse = {
            id: "user-1",
            username: "admin",
            email: "admin@mes.hu",
            phoneNumber: null,
            roles: ["SYSTEMADMIN"],
            active: true
        };
        mockApiFetch.mockResolvedValueOnce(mockUser);

        const result = await getMe();

        expect(result).toEqual(mockUser);
        expect(mockApiFetch).toHaveBeenCalledWith("/api/auth/me");
    });
});
