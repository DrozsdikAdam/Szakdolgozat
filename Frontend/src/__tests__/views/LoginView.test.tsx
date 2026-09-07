// Ez a teszt mesterséges intelligencia segítségével jön létre
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { LoginView } from "../../views/LoginView";
import { useAuth } from "../../hooks/UseAuth";
import type { UserResponse } from "../../types/user/User";

vi.mock("../../hooks/UseAuth", () => ({
    useAuth: vi.fn()
}));

const mockUseAuth = vi.mocked(useAuth);

describe("LoginView component", () => {
    const mockLogin = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders login form with username and password fields", () => {
        mockUseAuth.mockReturnValue({
            user: null,
            loading: false,
            error: null,
            login: mockLogin,
            logout: vi.fn(),
            checkSession: vi.fn()
        });

        render(
            <MemoryRouter>
                <LoginView />
            </MemoryRouter>
        );

        expect(screen.getByRole("heading", { name: "Bejelentkezés" })).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Adja meg felhasználónevét")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Adja meg jelszavát")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Bejelentkezés" })).toBeInTheDocument();
        expect(screen.getByText("Elfelejtette jelszavát?")).toBeInTheDocument();
    });

    it("shows loading spinner if loading is true", () => {
        mockUseAuth.mockReturnValue({
            user: null,
            loading: true,
            error: null,
            login: mockLogin,
            logout: vi.fn(),
            checkSession: vi.fn()
        });

        render(
            <MemoryRouter>
                <LoginView />
            </MemoryRouter>
        );

        expect(document.querySelector(".animate-spin")).toBeInTheDocument();
        expect(screen.queryByPlaceholderText("Adja meg felhasználónevét")).not.toBeInTheDocument();
    });

    it("redirects to home if user is already logged in", () => {
        const loggedUser: UserResponse = {
            id: "1",
            username: "existing_user",
            email: "test@mes.hu",
            phoneNumber: null,
            roles: ["OPERATOR"],
            active: true
        };

        mockUseAuth.mockReturnValue({
            user: loggedUser,
            loading: false,
            error: null,
            login: mockLogin,
            logout: vi.fn(),
            checkSession: vi.fn()
        });

        render(
            <MemoryRouter initialEntries={["/login"]}>
                <Routes>
                    <Route path="/login" element={<LoginView />} />
                    <Route path="/" element={<div>Home Page</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText("Home Page")).toBeInTheDocument();
    });

    it("displays validation error when submitting empty fields", async () => {
        const user = userEvent.setup();

        mockUseAuth.mockReturnValue({
            user: null,
            loading: false,
            error: null,
            login: mockLogin,
            logout: vi.fn(),
            checkSession: vi.fn()
        });

        render(
            <MemoryRouter>
                <LoginView />
            </MemoryRouter>
        );

        const submitBtn = screen.getByRole("button", { name: "Bejelentkezés" });
        await user.click(submitBtn);

        expect(mockLogin).not.toHaveBeenCalled();
        expect(screen.getByText("A felhasználónév mező kitöltése kötelező!")).toBeInTheDocument();
        expect(screen.getByText("A jelszó mező kitöltése kötelező!")).toBeInTheDocument();
    });

    it("submits valid credentials and calls login", async () => {
        const user = userEvent.setup();
        mockLogin.mockResolvedValueOnce(undefined);

        mockUseAuth.mockReturnValue({
            user: null,
            loading: false,
            error: null,
            login: mockLogin,
            logout: vi.fn(),
            checkSession: vi.fn()
        });

        render(
            <MemoryRouter>
                <LoginView />
            </MemoryRouter>
        );

        const usernameInput = screen.getByPlaceholderText("Adja meg felhasználónevét");
        const passwordInput = screen.getByPlaceholderText("Adja meg jelszavát");
        const submitBtn = screen.getByRole("button", { name: "Bejelentkezés" });

        await user.type(usernameInput, "operator1");
        await user.type(passwordInput, "ValidPass123!");
        await user.click(submitBtn);

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith("operator1", "ValidPass123!");
        });
    });

    it("displays server error message when login fails", async () => {
        const user = userEvent.setup();
        mockLogin.mockRejectedValueOnce(new Error("Hibás felhasználónév vagy jelszó!"));

        mockUseAuth.mockReturnValue({
            user: null,
            loading: false,
            error: null,
            login: mockLogin,
            logout: vi.fn(),
            checkSession: vi.fn()
        });

        render(
            <MemoryRouter>
                <LoginView />
            </MemoryRouter>
        );

        const usernameInput = screen.getByPlaceholderText("Adja meg felhasználónevét");
        const passwordInput = screen.getByPlaceholderText("Adja meg jelszavát");
        const submitBtn = screen.getByRole("button", { name: "Bejelentkezés" });

        await user.type(usernameInput, "operator1");
        await user.type(passwordInput, "ValidPass123!");
        await user.click(submitBtn);

        await waitFor(() => {
            expect(screen.getByText("Hibás felhasználónév vagy jelszó!")).toBeInTheDocument();
        });
    });
});
