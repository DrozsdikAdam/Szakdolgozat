// Ez a teszt mesterséges intelligencia segítségével jön létre
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    getProducts,
    getProductById,
    getActiveProducts,
    getDeletedProducts,
    getInactiveProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    deactivateProduct,
    activateProduct,
    restoreProduct
} from "../../services/productService";
import * as offlineHelper from "../../utils/offlineHelper";
import { apiFetch } from "../../utils/apiFetch";
import type { ProductCreateRequest, ProductResponse, ProductUpdateRequest } from "../../types/product/Product";

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
        cachedProducts: {
            get: vi.fn(),
            put: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            bulkPut: vi.fn(),
            filter: vi.fn().mockReturnValue({
                toArray: vi.fn().mockResolvedValue([])
            })
        }
    }
}));

describe("productService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
    });

    describe("getProducts", () => {
        it("calls fetchPagedWithOfflineCache with formatted pagination url", async () => {
            vi.mocked(offlineHelper.fetchPagedWithOfflineCache).mockResolvedValueOnce({} as any);

            await getProducts(2, 25);

            expect(offlineHelper.fetchPagedWithOfflineCache).toHaveBeenCalledWith(
                expect.objectContaining({
                    url: "/api/products?page=2&size=25"
                })
            );
        });
    });

    describe("getProductById", () => {
        it("calls fetchItemWithOfflineCache with correct item url", async () => {
            vi.mocked(offlineHelper.fetchItemWithOfflineCache).mockResolvedValueOnce({} as any);

            await getProductById("prod-123");

            expect(offlineHelper.fetchItemWithOfflineCache).toHaveBeenCalledWith(
                expect.objectContaining({
                    url: "/api/products/prod-123"
                })
            );
        });
    });

    describe("getActiveProducts", () => {
        it("fetches active products from api when online", async () => {
            const mockProducts: ProductResponse[] = [
                { id: "1", name: "Product 1", sku: "P1", unit: "db", active: true, createdAt: "" }
            ];
            vi.mocked(apiFetch).mockResolvedValueOnce(mockProducts);

            const result = await getActiveProducts();

            expect(result).toEqual(mockProducts);
            expect(apiFetch).toHaveBeenCalledWith("/api/products/active");
        });
    });

    describe("getDeletedProducts", () => {
        it("returns empty array when offline", async () => {
            Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
            const result = await getDeletedProducts();
            expect(result).toEqual([]);
        });

        it("calls apiFetch when online", async () => {
            const mockProducts: ProductResponse[] = [];
            vi.mocked(apiFetch).mockResolvedValueOnce(mockProducts);

            const result = await getDeletedProducts();
            expect(result).toEqual(mockProducts);
            expect(apiFetch).toHaveBeenCalledWith("/api/products/deleted");
        });
    });

    describe("getInactiveProducts", () => {
        it("calls apiFetch when online", async () => {
            vi.mocked(apiFetch).mockResolvedValueOnce([]);

            const result = await getInactiveProducts();
            expect(result).toEqual([]);
            expect(apiFetch).toHaveBeenCalledWith("/api/products/inactive");
        });
    });

    describe("createProduct", () => {
        it("calls mutateWithOfflineQueue with POST method and payload", async () => {
            const req: ProductCreateRequest = {
                name: "New Product",
                sku: "NP-01",
                description: "Test description",
                unit: "kg"
            };
            vi.mocked(offlineHelper.mutateWithOfflineQueue).mockResolvedValueOnce({} as any);

            await createProduct(req);

            expect(offlineHelper.mutateWithOfflineQueue).toHaveBeenCalledWith(
                expect.objectContaining({
                    url: "/api/products",
                    method: "POST",
                    payload: req
                })
            );
        });
    });

    describe("updateProduct", () => {
        it("calls mutateWithOfflineQueue with PUT method and payload", async () => {
            const req: ProductUpdateRequest = {
                name: "Updated Product",
                sku: "UP-01",
                unit: "m"
            };
            vi.mocked(offlineHelper.mutateWithOfflineQueue).mockResolvedValueOnce({} as any);

            await updateProduct("prod-1", req);

            expect(offlineHelper.mutateWithOfflineQueue).toHaveBeenCalledWith(
                expect.objectContaining({
                    url: "/api/products/prod-1",
                    method: "PUT",
                    payload: req
                })
            );
        });
    });

    describe("deleteProduct", () => {
        it("calls mutateWithOfflineQueue with DELETE method", async () => {
            vi.mocked(offlineHelper.mutateWithOfflineQueue).mockResolvedValueOnce(undefined as any);

            await deleteProduct("prod-1");

            expect(offlineHelper.mutateWithOfflineQueue).toHaveBeenCalledWith(
                expect.objectContaining({
                    url: "/api/products/prod-1",
                    method: "DELETE"
                })
            );
        });
    });

    describe("status transitions", () => {
        it("deactivateProduct calls PUT /deactivate", async () => {
            vi.mocked(offlineHelper.mutateWithOfflineQueue).mockResolvedValueOnce(undefined as any);
            await deactivateProduct("prod-1");
            expect(offlineHelper.mutateWithOfflineQueue).toHaveBeenCalledWith(
                expect.objectContaining({
                    url: "/api/products/prod-1/deactivate",
                    method: "PUT"
                })
            );
        });

        it("activateProduct calls PUT /activate", async () => {
            vi.mocked(offlineHelper.mutateWithOfflineQueue).mockResolvedValueOnce(undefined as any);
            await activateProduct("prod-1");
            expect(offlineHelper.mutateWithOfflineQueue).toHaveBeenCalledWith(
                expect.objectContaining({
                    url: "/api/products/prod-1/activate",
                    method: "PUT"
                })
            );
        });

        it("restoreProduct calls PUT /restore", async () => {
            vi.mocked(offlineHelper.mutateWithOfflineQueue).mockResolvedValueOnce(undefined as any);
            await restoreProduct("prod-1");
            expect(offlineHelper.mutateWithOfflineQueue).toHaveBeenCalledWith(
                expect.objectContaining({
                    url: "/api/products/prod-1/restore",
                    method: "PUT"
                })
            );
        });
    });
});
