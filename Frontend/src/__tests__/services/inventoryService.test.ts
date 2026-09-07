// Ez a teszt mesterséges intelligencia segítségével jön létre
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    getInventories,
    getInventoryByProductId,
    adjustStock,
    reserveStock,
    consumeStock,
    releaseStock
} from "../../services/inventoryService";
import * as offlineHelper from "../../utils/offlineHelper";
import type { InventoryUpdateRequest } from "../../types/inventory/inventory";

vi.mock("../../utils/offlineHelper", () => ({
    fetchPagedWithOfflineCache: vi.fn(),
    fetchItemWithOfflineCache: vi.fn(),
    mutateWithOfflineQueue: vi.fn()
}));

vi.mock("../../services/offlineDb", () => ({
    offlineDb: {
        cachedInventories: {
            where: vi.fn().mockReturnValue({
                equals: vi.fn().mockReturnValue({
                    first: vi.fn()
                })
            }),
            put: vi.fn(),
            update: vi.fn()
        }
    }
}));

describe("inventoryService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("getInventories calls fetchPagedWithOfflineCache with correct pagination", async () => {
        vi.mocked(offlineHelper.fetchPagedWithOfflineCache).mockResolvedValueOnce({} as any);

        await getInventories(1, 15);

        expect(offlineHelper.fetchPagedWithOfflineCache).toHaveBeenCalledWith(
            expect.objectContaining({
                url: "/api/inventory?page=1&size=15"
            })
        );
    });

    it("getInventoryByProductId calls fetchItemWithOfflineCache with productId url", async () => {
        vi.mocked(offlineHelper.fetchItemWithOfflineCache).mockResolvedValueOnce({} as any);

        await getInventoryByProductId("prod-456");

        expect(offlineHelper.fetchItemWithOfflineCache).toHaveBeenCalledWith(
            expect.objectContaining({
                url: "/api/inventory/product/prod-456"
            })
        );
    });

    it("adjustStock calls mutateWithOfflineQueue with POST /api/inventory/adjust", async () => {
        const req: InventoryUpdateRequest = {
            productId: "prod-456",
            amount: 10,
            location: "Shelf A"
        };
        vi.mocked(offlineHelper.mutateWithOfflineQueue).mockResolvedValueOnce({} as any);

        await adjustStock(req);

        expect(offlineHelper.mutateWithOfflineQueue).toHaveBeenCalledWith(
            expect.objectContaining({
                url: "/api/inventory/adjust",
                method: "POST",
                payload: req,
                actionType: "QUANTITY_REPORT"
            })
        );
    });

    it("reserveStock calls mutateWithOfflineQueue with POST /api/inventory/reserve", async () => {
        const req: InventoryUpdateRequest = {
            productId: "prod-456",
            amount: 5
        };
        vi.mocked(offlineHelper.mutateWithOfflineQueue).mockResolvedValueOnce({} as any);

        await reserveStock(req);

        expect(offlineHelper.mutateWithOfflineQueue).toHaveBeenCalledWith(
            expect.objectContaining({
                url: "/api/inventory/reserve",
                method: "POST",
                payload: req
            })
        );
    });

    it("consumeStock calls mutateWithOfflineQueue with POST /api/inventory/consume", async () => {
        const req: InventoryUpdateRequest = {
            productId: "prod-456",
            amount: 3
        };
        vi.mocked(offlineHelper.mutateWithOfflineQueue).mockResolvedValueOnce({} as any);

        await consumeStock(req);

        expect(offlineHelper.mutateWithOfflineQueue).toHaveBeenCalledWith(
            expect.objectContaining({
                url: "/api/inventory/consume",
                method: "POST",
                payload: req
            })
        );
    });

    it("releaseStock calls mutateWithOfflineQueue with POST /api/inventory/release", async () => {
        const req: InventoryUpdateRequest = {
            productId: "prod-456",
            amount: 2
        };
        vi.mocked(offlineHelper.mutateWithOfflineQueue).mockResolvedValueOnce({} as any);

        await releaseStock(req);

        expect(offlineHelper.mutateWithOfflineQueue).toHaveBeenCalledWith(
            expect.objectContaining({
                url: "/api/inventory/release",
                method: "POST",
                payload: req
            })
        );
    });
});
