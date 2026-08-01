export interface ProductResponse {
    id: string,
    name: string,
    sku: string,
    description?: string,
    unit: string,
    active: boolean,
    createdAt: string
}

export interface ProductCreateRequest {
    name: string,
    sku: string,
    description?: string,
    unit: string
}

export interface ProductUpdateRequest {
    name?: string,
    sku?: string,
    description?: string,
    unit?: string
}