export interface AuditResponseDto {
    id: string,
    action: string,
    details: string,
    status: 'SUCCESS' | 'FAILED',
    createdAt: string
}