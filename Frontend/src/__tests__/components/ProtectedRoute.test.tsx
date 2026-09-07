// Ez a teszt mesterséges intelligencia segítségével jön létre
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { useAuth } from "../../hooks/UseAuth";
import type { UserResponse } from "../../types/user/User";

vi.mock("../../hooks/UseAuth", () => ({
    useAuth: vi.fn()
}));

const mockUseAuth = vi.mocked(useAuth);

describe("ProtectedRoute", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders loading indicator when auth state is loading", () => {
        mockUseAuth.mockReturnValue({
            user: null,
            loading: true,
            error: null,
            login: vi.fn(),
            logout: vi.fn(),
            checkSession: vi.fn()
        });

        render(
            <MemoryRouter initialEntries={["/dashboard"]}>
                <ProtectedRoute>
                    <div>Dashboard Content</div>
                </ProtectedRoute>
            </MemoryRouter>
        );

        expect(screen.queryByText("Dashboard Content")).not.toBeInTheDocument();
        // LoadingSpinner contains animate-spin or svg
        expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });

    it("redirects unauthenticated user to /login with state", () => {
        mockUseAuth.mockReturnValue({
            user: null,
            loading: false,
            error: null,
            login: vi.fn(),
            logout: vi.fn(),
            checkSession: vi.fn()
        });

        render(
            <MemoryRouter initialEntries={["/dashboard"]}>
                <Routes>
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <div>Dashboard Content</div>
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/login" element={<div>Login Page</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText("Login Page")).toBeInTheDocument();
        expect(screen.queryByText("Dashboard Content")).not.toBeInTheDocument();
    });

    it("redirects to /unauthorized when user role is not allowed", () => {
        const user: UserResponse = {
            id: "1",
            username: "operator",
            email: "op@mes.hu",
            phoneNumber: null,
            roles: ["OPERATOR"],
            active: true
        };

        mockUseAuth.mockReturnValue({
            user,
            loading: false,
            error: null,
            login: vi.fn(),
            logout: vi.fn(),
            checkSession: vi.fn()
        });

        render(
            <MemoryRouter initialEntries={["/admin"]}>
                <Routes>
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute allowedRoles={["SYSTEMADMIN"]}>
                                <div>Admin Panel</div>
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/unauthorized" element={<div>Access Denied</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText("Access Denied")).toBeInTheDocument();
        expect(screen.queryByText("Admin Panel")).not.toBeInTheDocument();
    });

    it("renders children when user has at least one allowed role", () => {
        const user: UserResponse = {
            id: "1",
            username: "admin_user",
            email: "admin@mes.hu",
            phoneNumber: null,
            roles: ["SYSTEMADMIN", "MANAGER"],
            active: true
        };

        mockUseAuth.mockReturnValue({
            user,
            loading: false,
            error: null,
            login: vi.fn(),
            logout: vi.fn(),
            checkSession: vi.fn()
        });

        render(
            <MemoryRouter initialEntries={["/admin"]}>
                <ProtectedRoute allowedRoles={["SYSTEMADMIN"]}>
                    <div>Admin Panel</div>
                </ProtectedRoute>
            </MemoryRouter>
        );

        expect(screen.getByText("Admin Panel")).toBeInTheDocument();
    });

    it("renders children when no allowedRoles are specified and user is logged in", () => {
        const user: UserResponse = {
            id: "2",
            username: "generic_user",
            email: "user@mes.hu",
            phoneNumber: null,
            roles: ["OPERATOR"],
            active: true
        };

        mockUseAuth.mockReturnValue({
            user,
            loading: false,
            error: null,
            login: vi.fn(),
            logout: vi.fn(),
            checkSession: vi.fn()
        });

        render(
            <MemoryRouter initialEntries={["/profile"]}>
                <ProtectedRoute>
                    <div>Profile Content</div>
                </ProtectedRoute>
            </MemoryRouter>
        );

        expect(screen.getByText("Profile Content")).toBeInTheDocument();
    });
});
