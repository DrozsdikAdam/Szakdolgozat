import type { ProductResponse, ProductCreateRequest, ProductUpdateRequest } from '../types/Product';
import { apiFetch } from '../utils/apiFetch';

export const getProducts = async (): Promise<ProductResponse[]> => {
    return apiFetch<ProductResponse[]>("api/products");
};

export const getProductById = async (id: string): Promise<ProductResponse> => {
    return apiFetch<ProductResponse>(`api/products/${id}`);
};

export const getActiveProducts = async (): Promise<ProductResponse[]> => {
    return apiFetch<ProductResponse[]>("api/products/active");
};

export const getDeletedProducts = async (): Promise<ProductResponse[]> => {
    return apiFetch<ProductResponse[]>("api/products/deleted");
};

export const getInactiveProducts = async (): Promise<ProductResponse[]> => {
    return apiFetch<ProductResponse[]>("api/products/inactive");
};

export const createProduct = async (request: ProductCreateRequest): Promise<ProductResponse> => {
    return apiFetch<ProductResponse>("api/products", {
        method: "POST",
        body: JSON.stringify(request)
    });
};

export const updateProduct = async (id: string, request: ProductUpdateRequest): Promise<ProductResponse> => {
    return apiFetch<ProductResponse>(`api/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(request)
    });
};

export const deleteProduct = async (id: string): Promise<void> => {
    return apiFetch<void>(`api/products/${id}`, {
        method: "DELETE"
    });
};

export const deactivateProduct = async (id: string): Promise<void> => {
    return apiFetch<void>(`api/products/${id}/deactivate`, {
        method: "PUT"
    });
};

export const activateProduct = async (id: string): Promise<void> => {
    return apiFetch<void>(`api/products/${id}/activate`, {
        method: "PUT"
    });
};

export const restoreProduct = async (id: string): Promise<void> => {
    return apiFetch<void>(`api/products/${id}/restore`, {
        method: "PUT"
    });
};