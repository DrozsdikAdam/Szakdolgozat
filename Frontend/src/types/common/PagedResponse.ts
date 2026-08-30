export interface PagedResponse<T> {
    content: T[],
    pageNumber: number,
    pageSize: number,
    totalElements: number,
    totalPages: number,
    first?: boolean,
    last?: boolean,
}