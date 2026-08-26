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
import { getUsers } from "../../services/userService"
import { deleteMaintenance, getMaintenances } from "../../services/maintenanceService"
import { MaintenanceCard } from "../../components/maintenance/Card"
import { CreateMaintenanceModal } from "../../components/maintenance/modal/Create"
import { EditMaintenanceStatusModal } from "../../components/maintenance/modal/EditStatus"
import { getMachines } from "../../services/machineService"
import { useNavigate } from "react-router-dom"
import { DeleteConfirmModal } from "../../components/common/DeleteConfirmModal"

export const MaintenanceView = () => {

    const [maintenances, setMaintenances] = useState<MachineMaintenanceResponse[]>([])
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
                getUsers(),
                getMachines(),
                getMaintenances()
            ])
            setTechnicians(users.filter(u => u.roles.includes("TECHNICIAN")))
            setMachines(machines)
            setMaintenances(maintenances)
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
            setMaintenances(maintenances.filter((maintenance) => maintenance.id !== id))
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
        return maintenances.filter((maintenance) => {
            const matchesSearch = maintenance.title.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesStatus = statusFilter === "ALL" || maintenance.status === statusFilter
            const matchesType = typeFilter === "ALL" || maintenance.type === typeFilter
            return matchesSearch && matchesStatus && matchesType
        })
    }, [maintenances, searchTerm, statusFilter, typeFilter])

    useEffect(() => {
        loadData()
    }, [])

    return (
        <div className="relative flex-1 w-full flex flex-col items-center justify-start p-4 sm:p-6 font-sans">
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

            <div className="w-full max-w-7xl backdrop-blur-xl bg-slate-900/60 border border-slate-800 shadow-2xl rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 relative z-10">

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

                {filteredMaintenancies.length === 0 &&
                    <div className="text-left text-slate-400 text-sm font-medium">Nem található a keresési feltételeknek megfelelő karbantartás.</div>
                }

                {filteredMaintenancies.length > 0 && (
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
                )}

            </div>
        </div>
    )
}