// Ez a teszt mesterséges intelligencia segítségével jön létre
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { HomeRedirect } from "../../components/HomeRedirect";
import { useAuth } from "../../hooks/UseAuth";
import type { UserResponse } from "../../types/user/User";

vi.mock("../../hooks/UseAuth", () => ({
    useAuth: vi.fn()
}));

const mockUseAuth = vi.mocked(useAuth);

describe("HomeRedirect", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders loading spinner while checking auth status", () => {
        mockUseAuth.mockReturnValue({
            user: null,
            loading: true,
            error: null,
            login: vi.fn(),
            logout: vi.fn(),
            checkSession: vi.fn()
        });

        render(
            <MemoryRouter initialEntries={["/"]}>
                <HomeRedirect />
            </MemoryRouter>
        );

        expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });

    it("redirects to /login when user is not authenticated", () => {
        mockUseAuth.mockReturnValue({
            user: null,
            loading: false,
            error: null,
            login: vi.fn(),
            logout: vi.fn(),
            checkSession: vi.fn()
        });

        render(
            <MemoryRouter initialEntries={["/"]}>
                <Routes>
                    <Route path="/" element={<HomeRedirect />} />
                    <Route path="/login" element={<div>Login Page</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText("Login Page")).toBeInTheDocument();
    });

    it("redirects to /maintenance if user only has TECHNICIAN role", () => {
        const user: UserResponse = {
            id: "tech-1",
            username: "technician",
            email: "tech@mes.hu",
            phoneNumber: null,
            roles: ["TECHNICIAN"],
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
            <MemoryRouter initialEntries={["/"]}>
                <Routes>
                    <Route path="/" element={<HomeRedirect />} />
                    <Route path="/maintenance" element={<div>Maintenance Page</div>} />
                    <Route path="/product" element={<div>Product Page</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText("Maintenance Page")).toBeInTheDocument();
        expect(screen.queryByText("Product Page")).not.toBeInTheDocument();
    });

    it("redirects to /product if technician also has other roles", () => {
        const user: UserResponse = {
            id: "tech-mgr",
            username: "tech_manager",
            email: "techmgr@mes.hu",
            phoneNumber: null,
            roles: ["TECHNICIAN", "MANAGER"],
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
            <MemoryRouter initialEntries={["/"]}>
                <Routes>
                    <Route path="/" element={<HomeRedirect />} />
                    <Route path="/maintenance" element={<div>Maintenance Page</div>} />
                    <Route path="/product" element={<div>Product Page</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText("Product Page")).toBeInTheDocument();
    });

    it("redirects to /product for standard operators and admins", () => {
        const user: UserResponse = {
            id: "admin-1",
            username: "admin",
            email: "admin@mes.hu",
            phoneNumber: null,
            roles: ["SYSTEMADMIN"],
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
            <MemoryRouter initialEntries={["/"]}>
                <Routes>
                    <Route path="/" element={<HomeRedirect />} />
                    <Route path="/product" element={<div>Product Page</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText("Product Page")).toBeInTheDocument();
    });
});
