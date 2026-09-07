// Ez a teszt mesterséges intelligencia segítségével jön létre
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    getWorkOrders,
    getWorkOrderById,
    createWorkOrder,
    updateWorkOrderStatus,
    updateWorkOrderUser,
    updateWorkOrder
} from "../../services/workOrderService";
import * as offlineHelper from "../../utils/offlineHelper";
import type { WorkOrderCreateRequest, WorkOrderResponse, WorkOrderStatusUpdateRequest, WorkOrderUpdateRequest } from "../../types/workorder/workOrder";

vi.mock("../../utils/offlineHelper", () => ({
    fetchPagedWithOfflineCache: vi.fn(),
    fetchItemWithOfflineCache: vi.fn(),
    mutateWithOfflineQueue: vi.fn()
}));

vi.mock("../../services/offlineDb", () => ({
    offlineDb: {
        cachedWorkOrders: {
            get: vi.fn(),
            put: vi.fn(),
            update: vi.fn()
        },
        cachedProducts: {
            get: vi.fn()
        }
    }
}));

describe("workOrderService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("getWorkOrders", () => {
        it("calls fetchPagedWithOfflineCache with default query params when status is ALL", async () => {
            const mockPaged = {
                content: [],
                pageNumber: 0,
                pageSize: 20,
                totalElements: 0,
                totalPages: 1,
                first: true,
                last: true
            };
            vi.mocked(offlineHelper.fetchPagedWithOfflineCache).mockResolvedValueOnce(mockPaged);

            const result = await getWorkOrders(0, 20, "ALL");

            expect(result).toBe(mockPaged);
            expect(offlineHelper.fetchPagedWithOfflineCache).toHaveBeenCalledWith(
                expect.objectContaining({
                    url: "/api/work-orders?page=0&size=20"
                })
            );
        });

        it("appends status query param when status is not ALL", async () => {
            vi.mocked(offlineHelper.fetchPagedWithOfflineCache).mockResolvedValueOnce({} as any);

            await getWorkOrders(1, 10, "IN_PROGRESS");

            expect(offlineHelper.fetchPagedWithOfflineCache).toHaveBeenCalledWith(
                expect.objectContaining({
                    url: "/api/work-orders?page=1&size=10&status=IN_PROGRESS"
                })
            );
        });
    });

    describe("getWorkOrderById", () => {
        it("throws error when id is empty or undefined", async () => {
            await expect(getWorkOrderById("")).rejects.toThrow("Work order ID is undefined or empty");
            await expect(getWorkOrderById(undefined)).rejects.toThrow("Work order ID is undefined or empty");
        });

        it("calls fetchItemWithOfflineCache with correct URL", async () => {
            const mockOrder: WorkOrderResponse = {
                id: "wo-123",
                orderNumber: "WO-001",
                productName: "Widget A",
                productSku: "WA-01",
                productId: "prod-1",
                customerName: "Acme Corp",
                assignedUserId: "user-1",
                assignedUserName: "John Operator",
                targetQuantity: 100,
                producedQuantity: 50,
                scrapQuantity: 2,
                goodQuantity: 48,
                progressPercentage: 50,
                status: "IN_PROGRESS",
                priority: "HIGH",
                createdAt: new Date().toISOString()
            };
            vi.mocked(offlineHelper.fetchItemWithOfflineCache).mockResolvedValueOnce(mockOrder);

            const result = await getWorkOrderById("wo-123");

            expect(result).toBe(mockOrder);
            expect(offlineHelper.fetchItemWithOfflineCache).toHaveBeenCalledWith(
                expect.objectContaining({
                    url: "/api/work-orders/wo-123"
                })
            );
        });
    });

    describe("createWorkOrder", () => {
        it("calls mutateWithOfflineQueue with POST method and payload", async () => {
            const req: WorkOrderCreateRequest = {
                productId: "prod-1",
                targetQuantity: 50,
                customerName: "Global Industries",
                assignedUserId: "user-2",
                status: "PLANNED",
                priority: "MEDIUM"
            };

            const mockOrder: WorkOrderResponse = {
                id: "wo-999",
                orderNumber: "WO-999",
                productName: "Product X",
                productSku: "",
                productId: "prod-1",
                customerName: "Global Industries",
                assignedUserId: "user-2",
                assignedUserName: "User 2",
                targetQuantity: 50,
                producedQuantity: 0,
                scrapQuantity: 0,
                goodQuantity: 0,
                progressPercentage: 0,
                status: "PLANNED",
                priority: "MEDIUM",
                createdAt: new Date().toISOString()
            };

            vi.mocked(offlineHelper.mutateWithOfflineQueue).mockResolvedValueOnce(mockOrder);

            const result = await createWorkOrder(req);

            expect(result).toBe(mockOrder);
            expect(offlineHelper.mutateWithOfflineQueue).toHaveBeenCalledWith(
                expect.objectContaining({
                    url: "/api/work-orders",
                    method: "POST",
                    payload: req
                })
            );
        });
    });

    describe("updateWorkOrderStatus", () => {
        it("calls mutateWithOfflineQueue with PATCH method and status payload", async () => {
            const req: WorkOrderStatusUpdateRequest = {
                status: "COMPLETED",
                producedQuantity: 100,
                scrapQuantity: 5
            };

            vi.mocked(offlineHelper.mutateWithOfflineQueue).mockResolvedValueOnce({} as any);

            await updateWorkOrderStatus("wo-123", req);

            expect(offlineHelper.mutateWithOfflineQueue).toHaveBeenCalledWith(
                expect.objectContaining({
                    url: "/api/work-orders/wo-123/status",
                    method: "PATCH",
                    payload: req,
                    actionType: "STATUS_UPDATE"
                })
            );
        });
    });

    describe("updateWorkOrderUser", () => {
        it("calls mutateWithOfflineQueue with PATCH method and user URL", async () => {
            vi.mocked(offlineHelper.mutateWithOfflineQueue).mockResolvedValueOnce({} as any);

            await updateWorkOrderUser("wo-123", "user-555");

            expect(offlineHelper.mutateWithOfflineQueue).toHaveBeenCalledWith(
                expect.objectContaining({
                    url: "/api/work-orders/wo-123/user/user-555",
                    method: "PATCH",
                    payload: null
                })
            );
        });
    });

    describe("updateWorkOrder", () => {
        it("calls mutateWithOfflineQueue with PATCH and update payload", async () => {
            const req: WorkOrderUpdateRequest = {
                targetQuantity: 120,
                priority: "HIGH",
                customerName: "Updated Customer"
            };

            vi.mocked(offlineHelper.mutateWithOfflineQueue).mockResolvedValueOnce({} as any);

            await updateWorkOrder("wo-123", req);

            expect(offlineHelper.mutateWithOfflineQueue).toHaveBeenCalledWith(
                expect.objectContaining({
                    url: "/api/work-orders/wo-123",
                    method: "PATCH",
                    payload: req
                })
            );
        });
    });
});
