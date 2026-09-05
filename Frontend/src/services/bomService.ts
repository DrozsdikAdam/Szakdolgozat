import type { BOMItemRequest, BOMResponse, BOMTreeNode } from "../types/bom/bom";
import { apiFetch } from "../utils/apiFetch";
import { offlineDb } from "./offlineDb";

export const getBOMTree = async (parentProductId: string, quantity?: number): Promise<BOMTreeNode> => {
    const path = quantity ? `/api/bom/tree/${parentProductId}?quantity=${quantity}` : `/api/bom/tree/${parentProductId}`;

    if (!navigator.onLine) {
        const cached = await offlineDb.cachedBoms.where("parentProductId").equals(parentProductId).first();
        if (cached?.tree) return cached.tree as BOMTreeNode;
        return {
            productId: parentProductId,
            productName: "Termék (Offline BOM)",
            productSku: "",
            unit: "db",
            quantity: quantity || 1,
            children: []
        };
    }

    try {
        const response = await apiFetch<BOMTreeNode>(path);
        if (response) {
            await offlineDb.cachedBoms.put({
                parentProductId,
                tree: response,
                lastUpdated: Date.now()
            });
        }
        return response;
    } catch (error) {
        const cached = await offlineDb.cachedBoms.where("parentProductId").equals(parentProductId).first();
        if (cached?.tree) return cached.tree as BOMTreeNode;
        throw error;
    }
};

export const addComponentToBOMTree = async (request: BOMItemRequest): Promise<BOMResponse> => {
    const url = "/api/bom";

    const createOptimistic = (): BOMResponse => ({
        id: crypto.randomUUID(),
        parentProductId: request.parentProductId,
        componentProductId: request.componentProductId,
        componentProductName: "Hozzáadott komponens",
        componentProductSku: "",
        quantity: request.quantity,
        active: true
    });

    if (!navigator.onLine) {
        await offlineDb.saveOfflineAction(url, "POST", request, "GENERIC", "BOM komponens rögzítése");
        return createOptimistic();
    }

    try {
        return await apiFetch<BOMResponse>(url, {
            method: 'POST',
            body: JSON.stringify(request)
        });
    } catch (error) {
        await offlineDb.saveOfflineAction(url, "POST", request, "GENERIC", "BOM komponens rögzítése");
        return createOptimistic();
    }
};