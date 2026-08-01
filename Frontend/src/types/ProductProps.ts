import type { ProductResponse } from "./Product"

export interface RestoreProps {
    id: string,
    handleRestoreProduct: (id: string) => Promise<void>
}

export interface EditProps {
    product: ProductResponse,
    openModal: (product: ProductResponse) => void
}

export interface DeleteProps {
    id: string,
    handleDeleteProduct: (id: string) => Promise<void>
}

export interface ActivateProps {
    id: string,
    handleActivateProduct: (id: string) => Promise<void>
}

export interface DeactivateProps {
    id: string,
    handleDeactivateProduct: (id: string) => Promise<void>
}

export interface OperationProps {
    product: ProductResponse,
    activeTab: 'active' | 'inactive' | 'deleted',
    loadProducts: () => void,
    openModal: (product: ProductResponse | null) => void,
    setError: (error: string | null) => void,
    setIsLoading: (loading: boolean) => void
}

export interface TableProps {
    products: ProductResponse[],
    activeTab: 'active' | 'inactive' | 'deleted',
    loadProducts: () => void,
    openModal: (product: ProductResponse | null) => void,
    setError: (error: string | null) => void,
    setIsLoading: (loading: boolean) => void
}

export interface FilterBarProps {
    activeTab: string;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    setActiveTab: (tab: 'active' | 'inactive' | 'deleted') => void;
    openModal: (product: ProductResponse | null) => void;
}

export interface StatsProps {
    active: number;
    inactive: number;
    deleted: number;
}