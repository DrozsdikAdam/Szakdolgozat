import { useEffect, useMemo, useState } from "react"
import type { AuditAction, AuditEntityType, AuditLogResponse } from "../types/audit/AuditLog"
import { getLogs } from "../services/auditService"
import { Title } from "../components/common/Title"
import { LoadingSpinner } from "../components/common/LoadingSpinner"
import { Background } from "../components/common/Background"
import { FilterBar } from "../components/audit/FilterBar"
import { AuditTable } from "../components/audit/Table"
import type { PagedResponse } from "../types/common/PagedResponse"
import { Pagination } from "../components/common/Pagination"

export const AuditLogView = () => {

    const [pageData, setPageData] = useState<PagedResponse<AuditLogResponse>>({
        content: [],
        pageNumber: 0,
        pageSize: 10,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true
    })
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [selectedEntity, setSelectedEntity] = useState<AuditEntityType | "ALL">("ALL")
    const [selectedAction, setSelectedAction] = useState<AuditAction | "ALL">("ALL")
    const [error, setError] = useState<string | null>(null)

    const loadData = async (showSpinner: boolean = true) => {
        setIsLoading(showSpinner)
        setError(null)
        try {
            const response = await getLogs(pageData.pageNumber, pageData.pageSize, selectedEntity, selectedAction)
            setPageData(response)
        } catch (error) {
            setError(error instanceof Error ? error.message : "Unknown error")
        } finally {
            setIsLoading(false)
        }
    }

    const filteredLogs = useMemo(() => {
        return pageData.content.filter(log => {
            const matchesSearch = log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.entityId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.details.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesEntity = selectedEntity === "ALL" || log.entityType === selectedEntity
            const matchesAction = selectedAction === "ALL" || log.action === selectedAction
            return matchesSearch && matchesEntity && matchesAction
        })
    }, [pageData.content, searchTerm, selectedEntity, selectedAction])

    useEffect(() => {
        loadData(true);
        const intervalId = setInterval(async () => {
            await loadData(false);
        }, 5000);

        return () => clearInterval(intervalId);
    }, [pageData.pageNumber, pageData.pageSize, selectedEntity, selectedAction])

    useEffect(() => {
        setPageData(prev => ({ ...prev, pageNumber: 0 }));
    }, [selectedEntity, selectedAction, searchTerm]);

    return (
        <div className="relative flex-1 w-full flex flex-col items-center justify-start p-4 sm:p-6 font-sans">

            <Background />

            {isLoading && <LoadingSpinner />}

            {!isLoading &&
                <div className="w-full max-w-7xl backdrop-blur-xl bg-slate-900/60 border border-slate-800 shadow-2xl rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 relative z-10">
                    <Title page="audit" />

                    <FilterBar
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        selectedEntity={selectedEntity}
                        setSelectedEntity={setSelectedEntity}
                        selectedAction={selectedAction}
                        setSelectedAction={setSelectedAction}
                    />

                    {error &&
                        <div className="text-left text-rose-400 text-sm font-medium">{error}</div>
                    }

                    {pageData.content.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">Nincs a szűrésnek megfelelő naplóbejegyzés.</div>
                    ) : (
                        <Pagination
                            pageNumber={pageData.pageNumber}
                            pageSize={pageData.pageSize}
                            totalElements={pageData.totalElements}
                            totalPages={pageData.totalPages}
                            first={pageData.first}
                            last={pageData.last}
                            onPageChange={(newPage) => setPageData(prev => ({ ...prev, pageNumber: newPage }))}
                            onPageSizeChange={(newPageSize) => setPageData(prev => ({ ...prev, pageSize: newPageSize }))}
                        >
                            <AuditTable logs={filteredLogs} />
                        </Pagination>
                    )}
                </div>

            }
        </div>
    )
}