// Ez a teszt mesterséges intelligencia segítségével jön létre
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    getMachines,
    getInactiveMachines,
    getDeletedMachines,
    getMachineById,
    getMachinesByStatus,
    getMachinesByType,
    getMachinesByUserId,
    createMachine,
    updateMachine,
    updateMachineStatus,
    assignUserToMachine,
    unassignUserFromMachine,
    activateMachine,
    deactivateMachine,
    deleteMachine,
    restoreMachine,
    emergencyStop
} from "../../services/machineService";
import * as offlineHelper from "../../utils/offlineHelper";
import { apiFetch } from "../../utils/apiFetch";
import type { MachineCreateRequest, MachineStatusUpdateRequest, EmergencyStopRequest } from "../../types/machine/Machine";

vi.mock("../../utils/offlineHelper", () => ({
    fetchPagedWithOfflineCache: vi.fn(),
    fetchItemWithOfflineCache: vi.fn(),
    mutateWithOfflineQueue: vi.fn()
}));

vi.mock("../../utils/apiFetch", () => ({
    apiFetch: vi.fn()
}));

vi.mock("../../services/offlineDb", () => ({
    offlineDb: {
        cachedMachines: {
            get: vi.fn(),
            put: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            filter: vi.fn().mockReturnValue({
                toArray: vi.fn().mockResolvedValue([])
            }),
            where: vi.fn().mockReturnValue({
                equals: vi.fn().mockReturnValue({
                    toArray: vi.fn().mockResolvedValue([])
                })
            })
        }
    }
}));

describe("machineService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
    });

    it("getMachines calls fetchPagedWithOfflineCache with correct query params", async () => {
        vi.mocked(offlineHelper.fetchPagedWithOfflineCache).mockResolvedValueOnce({} as any);

        await getMachines(0, 10);

        expect(offlineHelper.fetchPagedWithOfflineCache).toHaveBeenCalledWith(
            expect.objectContaining({
                url: "/api/machines?page=0&size=10"
            })
        );
    });

    it("getInactiveMachines calls apiFetch when online", async () => {
        vi.mocked(apiFetch).mockResolvedValueOnce([]);

        const result = await getInactiveMachines();

        expect(result).toEqual([]);
        expect(apiFetch).toHaveBeenCalledWith("/api/machines/inactive");
    });

    it("getDeletedMachines calls apiFetch GET /api/machines/deleted", async () => {
        vi.mocked(apiFetch).mockResolvedValueOnce([]);

        const result = await getDeletedMachines();

        expect(result).toEqual([]);
        expect(apiFetch).toHaveBeenCalledWith("/api/machines/deleted");
    });

    it("getMachineById calls fetchItemWithOfflineCache with id url", async () => {
        vi.mocked(offlineHelper.fetchItemWithOfflineCache).mockResolvedValueOnce({} as any);

        await getMachineById("mach-1");

        expect(offlineHelper.fetchItemWithOfflineCache).toHaveBeenCalledWith(
            expect.objectContaining({
                url: "/api/machines/mach-1"
            })
        );
    });

    it("getMachinesByStatus calls apiFetch when online", async () => {
        vi.mocked(apiFetch).mockResolvedValueOnce([]);

        await getMachinesByStatus("RUNNING");

        expect(apiFetch).toHaveBeenCalledWith("/api/machines/status/RUNNING");
    });

    it("getMachinesByType calls apiFetch when online", async () => {
        vi.mocked(apiFetch).mockResolvedValueOnce([]);

        await getMachinesByType("CNC");

        expect(apiFetch).toHaveBeenCalledWith("/api/machines/type/CNC");
    });

    it("getMachinesByUserId calls apiFetch when online", async () => {
        vi.mocked(apiFetch).mockResolvedValueOnce([]);

        await getMachinesByUserId("user-1");

        expect(apiFetch).toHaveBeenCalledWith("/api/machines/user/user-1");
    });

    it("createMachine calls mutateWithOfflineQueue with POST", async () => {
        const req: MachineCreateRequest = {
            name: "CNC 01",
            code: "CNC-01",
            type: "CNC",
            status: "STOPPED",
            idealCycleTimeSeconds: 45,
            targetPcsPerHour: 80
        };
        vi.mocked(offlineHelper.mutateWithOfflineQueue).mockResolvedValueOnce({} as any);

        await createMachine(req);

        expect(offlineHelper.mutateWithOfflineQueue).toHaveBeenCalledWith(
            expect.objectContaining({
                url: "/api/machines",
                method: "POST",
                payload: req
            })
        );
    });

    it("updateMachine calls mutateWithOfflineQueue with PATCH", async () => {
        vi.mocked(offlineHelper.mutateWithOfflineQueue).mockResolvedValueOnce({} as any);

        await updateMachine("mach-1", { name: "CNC Updated" });

        expect(offlineHelper.mutateWithOfflineQueue).toHaveBeenCalledWith(
            expect.objectContaining({
                url: "/api/machines/mach-1",
                method: "PATCH"
            })
        );
    });

    it("updateMachineStatus calls mutateWithOfflineQueue with STATUS_UPDATE", async () => {
        const req: MachineStatusUpdateRequest = {
            status: "MAINTENANCE"
        };
        vi.mocked(offlineHelper.mutateWithOfflineQueue).mockResolvedValueOnce({} as any);

        await updateMachineStatus("mach-1", req);

        expect(offlineHelper.mutateWithOfflineQueue).toHaveBeenCalledWith(
            expect.objectContaining({
                url: "/api/machines/mach-1/status",
                method: "PATCH",
                actionType: "STATUS_UPDATE"
            })
        );
    });

    it("assignUserToMachine and unassignUserFromMachine call apiFetch", async () => {
        vi.mocked(apiFetch).mockResolvedValueOnce({} as any);
        await assignUserToMachine("mach-1", "user-1");
        expect(apiFetch).toHaveBeenCalledWith("/api/machines/mach-1/user/user-1", { method: "PATCH" });

        vi.mocked(apiFetch).mockResolvedValueOnce({} as any);
        await unassignUserFromMachine("mach-1");
        expect(apiFetch).toHaveBeenCalledWith("/api/machines/mach-1/unassign", { method: "PATCH" });
    });

    it("activateMachine and deactivateMachine mutate correctly", async () => {
        vi.mocked(offlineHelper.mutateWithOfflineQueue).mockResolvedValueOnce(undefined as any);
        await activateMachine("mach-1");
        expect(offlineHelper.mutateWithOfflineQueue).toHaveBeenCalledWith(
            expect.objectContaining({
                url: "/api/machines/mach-1/activate",
                method: "PATCH"
            })
        );

        vi.mocked(offlineHelper.mutateWithOfflineQueue).mockResolvedValueOnce(undefined as any);
        await deactivateMachine("mach-1");
        expect(offlineHelper.mutateWithOfflineQueue).toHaveBeenCalledWith(
            expect.objectContaining({
                url: "/api/machines/mach-1/deactivate",
                method: "PATCH"
            })
        );
    });

    it("deleteMachine and restoreMachine perform actions", async () => {
        vi.mocked(offlineHelper.mutateWithOfflineQueue).mockResolvedValueOnce(undefined as any);
        await deleteMachine("mach-1");
        expect(offlineHelper.mutateWithOfflineQueue).toHaveBeenCalledWith(
            expect.objectContaining({
                url: "/api/machines/mach-1",
                method: "DELETE"
            })
        );

        vi.mocked(apiFetch).mockResolvedValueOnce(undefined as any);
        await restoreMachine("mach-1");
        expect(apiFetch).toHaveBeenCalledWith("/api/machines/mach-1/restore", { method: "PATCH" });
    });

    it("emergencyStop calls mutateWithOfflineQueue with EMERGENCY_STOP action", async () => {
        const req: EmergencyStopRequest = { reason: "Overheating detected" };
        vi.mocked(offlineHelper.mutateWithOfflineQueue).mockResolvedValueOnce({} as any);

        await emergencyStop("mach-1", req);

        expect(offlineHelper.mutateWithOfflineQueue).toHaveBeenCalledWith(
            expect.objectContaining({
                url: "/api/machines/mach-1/emergency-stop",
                method: "POST",
                actionType: "EMERGENCY_STOP",
                payload: req
            })
        );
    });
});
