import type { BOMItemRequest, BOMResponse, BOMTreeNode } from "../types/bom/bom";
import { apiFetch } from "../utils/apiFetch";

export const getBOMTree = async (parentProductId: string, quantity?: number): Promise<BOMTreeNode> => {
    const path = quantity ? `api/bom/tree/${parentProductId}?quantity=${quantity}` : `api/bom/tree/${parentProductId}`;
    return apiFetch<BOMTreeNode>(path);
};

export const addComponentToBOMTree = async (request: BOMItemRequest): Promise<BOMResponse> => {
    return apiFetch<BOMResponse>("api/bom", {
        method: 'POST',
        body: JSON.stringify(request)
    });
};