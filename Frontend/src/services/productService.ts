import type { ProductResponse, ProductCreateRequest, ProductUpdateRequest } from '../types/product/Product';
import { apiFetch } from '../utils/apiFetch';
import type { PagedResponse } from '../types/common/PagedResponse';

export const getProducts = async (page: number = 0, size: number = 10): Promise<PagedResponse<ProductResponse>> => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("size", size.toString());
    return apiFetch<PagedResponse<ProductResponse>>(`api/products?${params.toString()}`);
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