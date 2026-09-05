import { Background } from "../../components/common/Background"
import { LoadingSpinner } from "../../components/common/LoadingSpinner"
import { Title } from "../../components/common/Title"
import { FilterBar } from "../../components/maintenance/FilterBar"
import { StatsCard } from "../../components/maintenance/StatsCard"
import { useEffect, useMemo, useState } from "react"
import type { MachineMaintenanceResponse } from "../../types/maintenance/MachineMaintenance"
import type { UserResponse } from "../../types/user/User"
import type { MachineResponse } from "../../types/machine/Machine"
import type { MaintenanceStatus, MaintenanceType } from "../../types/maintenance/MaintenanceStatus"
import { getAssignableUsers } from "../../services/userService"
import { deleteMaintenance, getMaintenances } from "../../services/maintenanceService"
import { MaintenanceCard } from "../../components/maintenance/Card"
import { CreateMaintenanceModal } from "../../components/maintenance/modal/Create"
import { EditMaintenanceStatusModal } from "../../components/maintenance/modal/EditStatus"
import { getMachines } from "../../services/machineService"
import { useNavigate } from "react-router-dom"
import { DeleteConfirmModal } from "../../components/common/modal/DeleteConfirm"
import type { PagedResponse } from "../../types/common/PagedResponse"
import { Pagination } from "../../components/common/Pagination"

export const MaintenanceView = () => {

    const [pagedMaintenances, setPagedMaintenances] = useState<PagedResponse<MachineMaintenanceResponse>>({
        content: [],
        pageNumber: 0,
        pageSize: 10,
        totalPages: 0,
        totalElements: 0,
        first: true,
        last: true
    })
    const [technicians, setTechnicians] = useState<UserResponse[]>([])
    const [machines, setMachines] = useState<MachineResponse[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    const [searchTerm, setSearchTerm] = useState<string>("")
    const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | "ALL">("ALL")
    const [typeFilter, setTypeFilter] = useState<MaintenanceType | "ALL">("ALL")

    const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false)
    const [selectedEditStatus, setSelectedEditStatus] = useState<MachineMaintenanceResponse | null>(null)
    const [maintenanceToDelete, setMaintenanceToDelete] = useState<MachineMaintenanceResponse | null>(null)

    const navigate = useNavigate();

    const loadData = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const [users, machines, maintenances] = await Promise.all([
                getAssignableUsers(),
                getMachines(0, 100),
                getMaintenances(pagedMaintenances.pageNumber, pagedMaintenances.pageSize)
            ])
            setTechnicians(users.filter(u => u.roles.includes("TECHNICIAN")))
            setMachines(machines.content)
            setPagedMaintenances(maintenances)
        } catch (error) {
            setError("Hiba történt a betöltés során!")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        setError(null)
        setIsLoading(true)

        try {
            await deleteMaintenance(id)
            loadData()
        } catch (error) {
            setError("Hiba történt a törlés során!")
            console.error(error)
        } finally {
            setIsLoading(false)
            setMaintenanceToDelete(null)
        }
    }

    const handleStatusUpdate = (maintenance: MachineMaintenanceResponse) => {
        setSelectedEditStatus(maintenance)
    }

    const filteredMaintenancies = useMemo(() => {
        return pagedMaintenances.content.filter((maintenance) => {
            const matchesSearch = maintenance.title.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesStatus = statusFilter === "ALL" || maintenance.status === statusFilter
            const matchesType = typeFilter === "ALL" || maintenance.type === typeFilter
            return matchesSearch && matchesStatus && matchesType
        })
    }, [pagedMaintenances.content, searchTerm, statusFilter, typeFilter])

    useEffect(() => {
        loadData()
    }, [pagedMaintenances.pageNumber, pagedMaintenances.pageSize])

    useEffect(() => {
        setPagedMaintenances(prev => ({ ...prev, pageNumber: 0 }))
    }, [searchTerm, statusFilter, typeFilter])

    return (
        <div className="page-container">
            <Background />

            {isLoading && <LoadingSpinner />}

            <CreateMaintenanceModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSuccess={loadData}
                machines={machines}
                technicians={technicians}
            />

            <EditMaintenanceStatusModal
                isOpen={!!selectedEditStatus}
                maintenance={selectedEditStatus}
                onClose={() => setSelectedEditStatus(null)}
                onSuccess={loadData}
                technicians={technicians}
            />

            <div className="page-card space-y-4 sm:space-y-5">

                <Title page="maintenance" />

                <StatsCard maintenances={filteredMaintenancies} />

                <FilterBar
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    typeFilter={typeFilter}
                    setTypeFilter={setTypeFilter}
                    onCreate={() => setIsCreateOpen(true)}
                />

                {maintenanceToDelete && (
                    <DeleteConfirmModal
                        isOpen={!!maintenanceToDelete}
                        onClose={() => setMaintenanceToDelete(null)}
                        onConfirm={() => handleDelete(maintenanceToDelete.id)}
                        title="Karbantartás törlése"
                        message={`Biztosan törli a karbantartás: ${maintenanceToDelete.title} (${maintenanceToDelete.machineCode} - ${maintenanceToDelete.machineName})?`}
                    />
                )}

                {error &&
                    <div className="text-left text-red-400 text-sm font-medium">{error}</div>
                }

                {pagedMaintenances.totalElements === 0 &&
                    <div className="text-left text-slate-400 text-sm font-medium">Nem található karbantartás.</div>
                }

                {pagedMaintenances.totalElements > 0 && filteredMaintenancies.length === 0 && (
                    <div className="text-left text-slate-400 text-sm font-medium">Nem található a keresési feltételeknek megfelelő karbantartás.</div>
                )}

                {filteredMaintenancies.length > 0 && (
                    <Pagination
                        pageNumber={pagedMaintenances.pageNumber}
                        pageSize={pagedMaintenances.pageSize}
                        totalElements={pagedMaintenances.totalElements}
                        totalPages={pagedMaintenances.totalPages}
                        first={pagedMaintenances.first}
                        last={pagedMaintenances.last}
                        onPageChange={(newPageNumber) => {
                            setPagedMaintenances(prev => ({ ...prev, pageNumber: newPageNumber }))
                        }}
                        onPageSizeChange={(newPageSize) => {
                            setPagedMaintenances(prev => ({ ...prev, pageSize: newPageSize, pageNumber: 0 }))
                        }}
                    >
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {filteredMaintenancies.map((maintenance) => (
                                <MaintenanceCard
                                    key={maintenance.id}
                                    maintenance={maintenance}
                                    onEdit={() => navigate(`/maintenance/${maintenance.id}/edit`)}
                                    onStatusUpdate={() => handleStatusUpdate(maintenance)}
                                    onDelete={() => setMaintenanceToDelete(maintenance)}
                                />
                            ))}
                        </div>
                    </Pagination>
                )}
            </div>
        </div>
    )
}