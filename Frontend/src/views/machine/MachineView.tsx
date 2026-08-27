import { useEffect, useMemo, useState } from "react"
import type { MachineResponse, MachineStatusUpdateRequest } from "../../types/machine/Machine"
import type { UserResponse } from "../../types/user/User"
import type { MachineStatus, MachineType } from "../../types/machine/MachineStatus"
import { assignUserToMachine, deleteMachine, getMachines, unassignUserFromMachine, updateMachineStatus } from "../../services/machineService"
import { getUsers } from "../../services/userService"
import { Background } from "../../components/common/Background"
import { LoadingSpinner } from "../../components/common/LoadingSpinner"
import { Title } from "../../components/common/Title"
import { MachineStatsCard } from "../../components/machine/StatsCard"
import { MachineFilterBar } from "../../components/machine/Filterbar"
import { MachineCard } from "../../components/machine/Card"
import { EditMachineModal } from "../../components/machine/modal/Edit"
import { useNavigate } from "react-router-dom"
import { DeleteConfirmModal } from "../../components/common/DeleteConfirmModal"
import { EmergencyStopModal } from "../../components/machine/modal/EmergencyStop"
import type { WorkOrderResponse, WorkOrderStatusUpdateRequest } from "../../types/workorder/workOrder"
import { getWorkOrders, updateWorkOrderStatus, updateWorkOrderUser } from "../../services/workOrderService"
export const MachineView = () => {

    const [machines, setMachines] = useState<MachineResponse[]>([])
    const [users, setUsers] = useState<UserResponse[]>([])
    const [technicians, setTechnicians] = useState<UserResponse[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const navigate = useNavigate()

    const [searchTerm, setSearchTerm] = useState<string>("")
    const [statusFilter, setStatusFilter] = useState<MachineStatus | "ALL">("ALL")
    const [typeFilter, setTypeFilter] = useState<MachineType | "ALL">("ALL")
    const [selectedMachine, setSelectedMachine] = useState<MachineResponse | null>(null)

    const [machineToDelete, setMachineToDelete] = useState<MachineResponse | null>(null)
    const [machineToEmergencyStop, setMachineToEmergencyStop] = useState<MachineResponse | null>(null)
    const [workOrders, setWorkOrders] = useState<WorkOrderResponse[]>([])

    const loadData = async (showSpinner: boolean = true) => {
        if (showSpinner) setIsLoading(true)
        setError(null)
        try {
            const [machinesRes, usersRes, workOrdersRes] = await Promise.all([
                getMachines(),
                getUsers(),
                getWorkOrders()
            ])

            const operators = usersRes.filter(u => u.roles.includes("OPERATOR") || u.roles.includes("SYSTEMADMIN"));
            const techs = usersRes.filter(u => u.roles.includes("TECHNICIAN") || u.roles.includes("SYSTEMADMIN"));

            setMachines(machinesRes);
            setUsers(operators);
            setTechnicians(techs);
            setWorkOrders(workOrdersRes);

        } catch (err) {
            setError(err instanceof Error ? err.message : "Ismeretlen hiba")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async () => {
        loadData();
    }

    const handleStartWorkOrder = async (machineId: string, workOrderId: string, machineUserId?: string) => {
        if (!machineUserId) {
            setError("A gyártás indításához előbb rendeljen hozzá egy felelős gépkezelőt a géphez!");
            return;
        }
        setIsLoading(true);
        setError(null);
        const workOrder = workOrders.find(wo => wo.id === workOrderId);
        if (!workOrder) {
            setIsLoading(false);
            return;
        }

        const orderRequest: WorkOrderStatusUpdateRequest = {
            status: "IN_PROGRESS",
            producedQuantity: workOrder.producedQuantity || 0,
            scrapQuantity: workOrder.scrapQuantity || 0
        };

        try {
            await updateWorkOrderUser(workOrderId, machineUserId);
            await updateWorkOrderStatus(workOrderId, orderRequest);
            await updateMachineStatus(machineId, { status: "RUNNING" });
            loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ismeretlen hiba történt a gyártás indításakor");
        }
    };

    const handleDelete = async (id: string) => {
        setIsLoading(true)
        setError(null)

        try {
            await deleteMachine(id)
            loadData()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ismeretlen hiba")
        } finally {
            setIsLoading(false)
            setMachineToDelete(null)
        }
    }

    const handleStatusChange = async (id: string, newStatus: MachineStatus) => {
        setIsLoading(true)
        setError(null)

        const request: MachineStatusUpdateRequest = {
            status: newStatus
        }

        try {
            await updateMachineStatus(id, request)
            loadData()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ismeretlen hiba")
        } finally {
            setIsLoading(false)
        }
    }

    const handleAssingUser = async (id: string, userId: string) => {
        setIsLoading(true)
        setError(null)

        try {
            if (!userId)
                await unassignUserFromMachine(id);
            else
                await assignUserToMachine(id, userId);

            loadData()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ismeretlen hiba")
        } finally {
            setIsLoading(false)
        }
    }

    const closeModals = () => {
        setSelectedMachine(null);
        setMachineToEmergencyStop(null);
    }

    const filteredMachines = useMemo(() => {
        return machines.filter(m => {
            const matchesSearch = m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.name.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesStatus = statusFilter === "ALL" || m.status === statusFilter
            const matchesType = typeFilter === "ALL" || m.type === typeFilter
            return matchesSearch && matchesStatus && matchesType
        })
    }, [machines, searchTerm, statusFilter, typeFilter])


    useEffect(() => {
        loadData(true)
        const interval = setInterval(() => loadData(false), 5000)
        return () => clearInterval(interval)
    }, [])
    return (
        <div className="relative flex-1 w-full flex flex-col items-center justify-start p-4 sm:p-6 font-sans">
            <Background />

            {isLoading && <LoadingSpinner />}

            {!isLoading &&
                <div className="w-full max-w-7xl backdrop-blur-xl bg-slate-900/60 border border-slate-800 shadow-2xl rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 relative z-10">

                    <Title page="machine" />

                    <MachineStatsCard machines={machines} />

                    <MachineFilterBar
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        typeFilter={typeFilter}
                        setTypeFilter={setTypeFilter}
                        onCreate={() => navigate("/machine/create")}
                    />

                    <EditMachineModal
                        isOpen={!!selectedMachine}
                        onClose={closeModals}
                        onSuccess={handleSubmit}
                        machine={selectedMachine}
                        users={users}
                    />

                    {machineToEmergencyStop && (
                        <EmergencyStopModal
                            isOpen={!!machineToEmergencyStop}
                            onClose={() => setMachineToEmergencyStop(null)}
                            onSuccess={loadData}
                            machineId={machineToEmergencyStop.id}
                            technicians={technicians}
                        />
                    )}

                    {machineToDelete && (
                        <DeleteConfirmModal
                            isOpen={!!machineToDelete}
                            onClose={() => setMachineToDelete(null)}
                            onConfirm={() => handleDelete(machineToDelete.id)}
                            title="Gép törlése"
                            message={`Biztosan törli a gép: ${machineToDelete.code} (${machineToDelete.name})?`}
                        />
                    )}

                    {error &&
                        <div className="text-left text-red-400 text-sm font-medium">{error}</div>
                    }

                    {machines.length === 0 && (
                        <div className="text-left text-slate-400 text-sm font-medium">Még nincs rögzítve gép a rendszerben.</div>
                    )}

                    {machines.length > 0 && filteredMachines.length === 0 && (
                        <div className="text-left text-slate-400 text-sm font-medium">Nem található a keresési feltételeknek megfelelő gép.</div>
                    )}

                    {filteredMachines.length > 0 &&
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {filteredMachines.map((machine) => (
                                <MachineCard
                                    key={machine.id}
                                    machine={machine}
                                    workOrders={workOrders}
                                    users={users}
                                    onEdit={() => setSelectedMachine(machine)}
                                    onDelete={() => setMachineToDelete(machine)}
                                    onStatusChange={handleStatusChange}
                                    onAssignUser={handleAssingUser}
                                    onStartWorkOrder={handleStartWorkOrder}
                                    onEmergencyStop={() => setMachineToEmergencyStop(machine)}
                                />
                            ))}
                        </div>
                    }
                </div>
            }
        </div>
    )
}