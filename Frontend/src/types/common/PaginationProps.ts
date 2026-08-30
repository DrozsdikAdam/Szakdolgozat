import type { ReactNode } from "react";

export interface PaginationProps {
    children?: ReactNode,
    pageNumber: number,
    pageSize: number,
    totalElements: number,
    totalPages: number,
    first?: boolean,
    last?: boolean,
    onPageChange: (pageNumber: number) => void,
    onPageSizeChange: (pageSize: number) => void,
}