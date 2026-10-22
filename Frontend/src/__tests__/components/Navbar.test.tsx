// Ez a teszt mesterséges intelligencia segítségével jön létre
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Navbar } from "../../components/Navbar";
import { useAuth } from "../../hooks/UseAuth";
import { useNetworkStatus } from "../../hooks/UseNetworkStatus";
import { useSyncStatus } from "../../hooks/UseSyncStatus";
import type { UserResponse } from "../../types/user/User";

vi.mock("../../hooks/UseAuth", () => ({
    useAuth: vi.fn()
}));

vi.mock("../../hooks/UseNetworkStatus", () => ({
    useNetworkStatus: vi.fn()
}));

vi.mock("../../hooks/UseSyncStatus", () => ({
    useSyncStatus: vi.fn()
}));

vi.mock("../../components/notification/NotificationBell", () => ({
    NotificationBell: () => <div data-testid="notification-bell">Bell</div>
}));

vi.mock("../../components/profile/ProfileModal", () => ({
    ProfileModal: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-testid="profile-modal">ProfileModal</div> : null)
}));

vi.mock("../../components/offline/modal/SyncConflict", () => ({
    SyncConflictModal: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-testid="sync-modal">SyncModal</div> : null)
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual<any>("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

describe("Navbar component", () => {
    const mockLogout = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(useNetworkStatus).mockReturnValue({
            isOnline: true,
            pendingCount: 0,
            refreshPendingCount: vi.fn()
        });

        vi.mocked(useSyncStatus).mockReturnValue({
            isSyncing: false,
            conflictCount: 0,
            current: 0,
            total: 0,
            syncNow: vi.fn(),
            refreshCount: vi.fn().mockResolvedValue(0)
        });
    });

    it("renders operator-accessible navigation items and hides admin-only items", () => {
        const operatorUser: UserResponse = {
            id: "op-1",
            username: "operator_jane",
            email: "jane@mes.hu",
            phoneNumber: null,
            roles: ["OPERATOR"],
            active: true
        };

        vi.mocked(useAuth).mockReturnValue({
            user: operatorUser,
            loading: false,
            error: null,
            login: vi.fn(),
            logout: mockLogout,
            checkSession: vi.fn()
        });

        render(
            <MemoryRouter>
                <Navbar />
            </MemoryRouter>
        );

        // Operator has access to Termékek, Raktárkészlet, Gyártási rendelések, Gépek
        expect(screen.getByText("Termékek")).toBeInTheDocument();
        expect(screen.getByText("Raktárkészlet")).toBeInTheDocument();
        expect(screen.getByText("Gyártási rendelések")).toBeInTheDocument();
        expect(screen.getByText("Gépek")).toBeInTheDocument();

        // Operator should NOT see Felhasználók or Napló
        expect(screen.queryByText("Felhasználók")).not.toBeInTheDocument();
        expect(screen.queryByText("Napló")).not.toBeInTheDocument();

        // Displays username
        expect(screen.getByText("operator_jane")).toBeInTheDocument();
    });

    it("renders admin navigation items for SYSTEMADMIN", () => {
        const adminUser: UserResponse = {
            id: "admin-1",
            username: "admin_boss",
            email: "boss@mes.hu",
            phoneNumber: null,
            roles: ["SYSTEMADMIN"],
            active: true
        };

        vi.mocked(useAuth).mockReturnValue({
            user: adminUser,
            loading: false,
            error: null,
            login: vi.fn(),
            logout: mockLogout,
            checkSession: vi.fn()
        });

        render(
            <MemoryRouter>
                <Navbar />
            </MemoryRouter>
        );

        expect(screen.getByText("Felhasználók")).toBeInTheDocument();
        expect(screen.getByText("Napló")).toBeInTheDocument();
        expect(screen.getByText("Analitika")).toBeInTheDocument();
        expect(screen.getByText("Gyártási tervek")).toBeInTheDocument();
    });

    it("handles logout click and redirects to /login", async () => {
        const user = userEvent.setup();
        const testUser: UserResponse = {
            id: "u-1",
            username: "testuser",
            email: "test@mes.hu",
            phoneNumber: null,
            roles: ["OPERATOR"],
            active: true
        };

        vi.mocked(useAuth).mockReturnValue({
            user: testUser,
            loading: false,
            error: null,
            login: vi.fn(),
            logout: mockLogout,
            checkSession: vi.fn()
        });

        render(
            <MemoryRouter>
                <Navbar />
            </MemoryRouter>
        );

        const logoutBtn = screen.getByTitle("Kijelentkezés");
        await user.click(logoutBtn);

        expect(mockLogout).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith("/login");
    });

    it("shows syncing indicator when sync is active", () => {
        vi.mocked(useAuth).mockReturnValue({
            user: null,
            loading: false,
            error: null,
            login: vi.fn(),
            logout: mockLogout,
            checkSession: vi.fn()
        });

        vi.mocked(useSyncStatus).mockReturnValue({
            isSyncing: true,
            conflictCount: 0,
            current: 2,
            total: 5,
            syncNow: vi.fn(),
            refreshCount: vi.fn().mockResolvedValue(0)
        });

        render(
            <MemoryRouter>
                <Navbar />
            </MemoryRouter>
        );

        expect(screen.getByText("2/5")).toBeInTheDocument();
    });

    it("toggles profile modal when user button is clicked", async () => {
        const user = userEvent.setup();
        const testUser: UserResponse = {
            id: "u-1",
            username: "testuser",
            email: "test@mes.hu",
            phoneNumber: null,
            roles: ["OPERATOR"],
            active: true
        };

        vi.mocked(useAuth).mockReturnValue({
            user: testUser,
            loading: false,
            error: null,
            login: vi.fn(),
            logout: mockLogout,
            checkSession: vi.fn()
        });

        render(
            <MemoryRouter>
                <Navbar />
            </MemoryRouter>
        );

        expect(screen.queryByTestId("profile-modal")).not.toBeInTheDocument();

        const profileBtn = screen.getByTitle("Profil megtekintése");
        await user.click(profileBtn);

        expect(screen.getByTestId("profile-modal")).toBeInTheDocument();
    });
});
