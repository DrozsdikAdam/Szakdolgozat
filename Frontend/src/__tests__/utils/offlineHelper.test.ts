// Ez a teszt mesterséges intelligencia segítségével jön létre
import { describe, it, expect, vi, beforeEach } from "vitest";
import { isNetworkError, mutateWithOfflineQueue } from "../../utils/offlineHelper";
import { ApiError } from "../../utils/apiFetch";
import * as apiFetchModule from "../../utils/apiFetch";
import { offlineDb } from "../../services/offlineDb";

vi.mock("../../services/offlineDb", () => ({
    offlineDb: {
        saveOfflineAction: vi.fn(),
        cachedWorkOrders: {
            update: vi.fn(),
            get: vi.fn()
        }
    }
}));

describe("offlineHelper utility", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.defineProperty(navigator, "onLine", { value: true, configurable: true, writable: true });
    });

    describe("isNetworkError", () => {
        it("returns true when navigator.onLine is false", () => {
            Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
            expect(isNetworkError(new Error("bármilyen hiba"))).toBe(true);
        });

        it("returns false when error is an instance of ApiError", () => {
            const apiError = new ApiError("Nincs elég készlet", 400);
            expect(isNetworkError(apiError)).toBe(false);
        });

        it("returns false when error has a status property", () => {
            expect(isNetworkError({ message: "Hibás kérés", status: 400 })).toBe(false);
        });

        it("returns true for TypeError from fetch", () => {
            const fetchError = new TypeError("Failed to fetch");
            expect(isNetworkError(fetchError)).toBe(true);
        });

        it("returns false for regular application Error", () => {
            const appError = new Error("Validation failure");
            expect(isNetworkError(appError)).toBe(false);
        });
    });

    describe("mutateWithOfflineQueue", () => {
        it("does NOT enqueue offline action and re-throws when apiFetch rejects with ApiError (e.g. 400 Bad Request)", async () => {
            const apiError = new ApiError("Nincs elég alapanyag raktáron!", 400);
            vi.spyOn(apiFetchModule, "apiFetch").mockRejectedValueOnce(apiError);

            const applyOptimistic = vi.fn().mockResolvedValue({ id: "wo-1", status: "PREPARED" });

            await expect(
                mutateWithOfflineQueue({
                    url: "/api/work-orders/wo-1/status",
                    method: "PATCH",
                    payload: { status: "PREPARED", producedQuantity: 0, scrapQuantity: 0 },
                    actionType: "STATUS_UPDATE",
                    entityName: "Munkalap státusz módosítása",
                    applyOptimistic
                })
            ).rejects.toThrow("Nincs elég alapanyag raktáron!");

            expect(offlineDb.saveOfflineAction).not.toHaveBeenCalled();
            expect(applyOptimistic).not.toHaveBeenCalled();
        });

        it("enqueues offline action and applies optimistic update when TypeError (network failure) occurs", async () => {
            const networkError = new TypeError("Failed to fetch");
            vi.spyOn(apiFetchModule, "apiFetch").mockRejectedValueOnce(networkError);

            const optimisticResult = { id: "wo-1", status: "PREPARED" };
            const applyOptimistic = vi.fn().mockResolvedValue(optimisticResult);

            const result = await mutateWithOfflineQueue({
                url: "/api/work-orders/wo-1/status",
                method: "PATCH",
                payload: { status: "PREPARED", producedQuantity: 0, scrapQuantity: 0 },
                actionType: "STATUS_UPDATE",
                entityName: "Munkalap státusz módosítása",
                applyOptimistic
            });

            expect(offlineDb.saveOfflineAction).toHaveBeenCalledWith(
                "/api/work-orders/wo-1/status",
                "PATCH",
                { status: "PREPARED", producedQuantity: 0, scrapQuantity: 0 },
                "STATUS_UPDATE",
                "Munkalap státusz módosítása"
            );
            expect(applyOptimistic).toHaveBeenCalled();
            expect(result).toEqual(optimisticResult);
        });

        it("returns api response directly when apiFetch succeeds", async () => {
            const responseData = { id: "wo-1", status: "PREPARED" };
            vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValueOnce(responseData);
            const applyOptimistic = vi.fn();
            const onSuccess = vi.fn();

            const result = await mutateWithOfflineQueue({
                url: "/api/work-orders/wo-1/status",
                method: "PATCH",
                payload: { status: "PREPARED" },
                entityName: "Munkalap státusz módosítása",
                applyOptimistic,
                onSuccess
            });

            expect(result).toEqual(responseData);
            expect(onSuccess).toHaveBeenCalledWith(responseData);
            expect(offlineDb.saveOfflineAction).not.toHaveBeenCalled();
            expect(applyOptimistic).not.toHaveBeenCalled();
        });
    });
});
