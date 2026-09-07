// Ez a teszt mesterséges intelligencia segítségével jön létre
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider } from "../../context/AuthContext";
import { useAuth } from "../../hooks/UseAuth";
import { apiFetch } from "../../utils/apiFetch";
import type { UserResponse } from "../../types/user/User";

vi.mock("../../utils/apiFetch", () => ({
    apiFetch: vi.fn()
}));

const mockApiFetch = vi.mocked(apiFetch);

const mockUser: UserResponse = {
    id: "user-123",
    username: "john_doe",
    email: "john@example.com",
    phoneNumber: "+36301234567",
    roles: ["OPERATOR"],
    active: true
};

const TestConsumer = () => {
    const { user, loading, error, login, logout, checkSession } = useAuth();

    return (
        <div>
            <div data-testid="loading">{loading ? "loading" : "idle"}</div>
            <div data-testid="user">{user ? user.username : "anonymous"}</div>
            <div data-testid="error">{error || "none"}</div>
            <button onClick={() => login("john_doe", "Secret123!").catch(() => { })}>Login</button>
            <button onClick={() => logout().catch(() => { })}>Logout</button>
            <button onClick={() => checkSession().catch(() => { })}>CheckSession</button>
        </div>
    );
};

describe("AuthContext & AuthProvider", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("throws error if useAuth is used outside AuthProvider", () => {
        // Suppress console.error in React for expected error boundary / throw
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { });
        expect(() => render(<TestConsumer />)).toThrow("useAuth must be used within AuthProvider");
        consoleSpy.mockRestore();
    });

    it("checks session on mount and populates user if session is valid", async () => {
        mockApiFetch.mockResolvedValueOnce(mockUser);

        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );

        expect(screen.getByTestId("loading").textContent).toBe("loading");

        await waitFor(() => {
            expect(screen.getByTestId("loading").textContent).toBe("idle");
        });

        expect(screen.getByTestId("user").textContent).toBe("john_doe");
        expect(mockApiFetch).toHaveBeenCalledWith("/api/auth/me");
    });

    it("sets user to null if checkSession fails", async () => {
        mockApiFetch.mockRejectedValueOnce(new Error("Unauthorized"));

        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId("loading").textContent).toBe("idle");
        });

        expect(screen.getByTestId("user").textContent).toBe("anonymous");
    });

    it("logs in successfully and updates state", async () => {
        mockApiFetch.mockRejectedValueOnce(new Error("Not logged in")); // checkSession on mount
        mockApiFetch.mockResolvedValueOnce(mockUser); // login call

        const user = userEvent.setup();
        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId("loading").textContent).toBe("idle");
        });

        const loginBtn = screen.getByRole("button", { name: "Login" });
        await user.click(loginBtn);

        await waitFor(() => {
            expect(screen.getByTestId("user").textContent).toBe("john_doe");
            expect(screen.getByTestId("loading").textContent).toBe("idle");
        });

        expect(mockApiFetch).toHaveBeenCalledWith("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ username: "john_doe", password: "Secret123!" })
        });
    });

    it("handles login error properly and sets error state", async () => {
        mockApiFetch.mockRejectedValueOnce(new Error("Not logged in")); // mount
        mockApiFetch.mockRejectedValueOnce(new Error("Invalid credentials")); // login

        const user = userEvent.setup();
        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId("loading").textContent).toBe("idle");
        });

        const loginBtn = screen.getByRole("button", { name: "Login" });
        await user.click(loginBtn);

        await waitFor(() => {
            expect(screen.getByTestId("error").textContent).toBe("Invalid credentials");
            expect(screen.getByTestId("user").textContent).toBe("anonymous");
        });
    });

    it("logs out and clears user state", async () => {
        mockApiFetch.mockResolvedValueOnce(mockUser); // mount checkSession
        mockApiFetch.mockResolvedValueOnce({ message: "Logged out" }); // logout

        const user = userEvent.setup();
        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId("user").textContent).toBe("john_doe");
        });

        const logoutBtn = screen.getByRole("button", { name: "Logout" });
        await user.click(logoutBtn);

        await waitFor(() => {
            expect(screen.getByTestId("user").textContent).toBe("anonymous");
        });

        expect(mockApiFetch).toHaveBeenCalledWith("/api/auth/logout", {
            method: "POST"
        });
    });
});
