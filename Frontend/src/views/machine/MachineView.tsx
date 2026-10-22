import { useEffect, useMemo, useState } from "react"
import type { MachineResponse, MachineStatusUpdateRequest } from "../../types/machine/Machine"
import type { UserResponse } from "../../types/user/User"
import type { MachineStatus, MachineType } from "../../types/machine/MachineStatus"
import { assignUserToMachine, deleteMachine, getMachines, unassignUserFromMachine, updateMachineStatus } from "../../services/machineService"
import { getAssignableUsers } from "../../services/userService"
import { Background } from "../../components/common/Background"
import { LoadingSpinner } from "../../components/common/LoadingSpinner"
import { Title } from "../../components/common/Title"
import { MachineStatsCard } from "../../components/machine/StatsCard"
import { MachineFilterBar } from "../../components/machine/Filterbar"
import { MachineCard } from "../../components/machine/Card"
import { EditMachineModal } from "../../components/machine/modal/Edit"
import { useNavigate } from "react-router-dom"
import { DeleteConfirmModal } from "../../components/common/modal/DeleteConfirm"
import { EmergencyStopModal } from "../../components/machine/modal/EmergencyStop"
import type { WorkOrderResponse, WorkOrderStatusUpdateRequest } from "../../types/workorder/workOrder"
import { getWorkOrders, updateWorkOrderStatus, updateWorkOrderUser } from "../../services/workOrderService"
import type { PagedResponse } from "../../types/common/PagedResponse"
import { Pagination } from "../../components/common/Pagination"

export const MachineView = () => {

    const [pagedMachines, setPagedMachines] = useState<PagedResponse<MachineResponse>>({
        content: [],
        pageNumber: 0,
        pageSize: 10,
        totalPages: 0,
        totalElements: 0,
        first: true,
        last: true
    })
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
                getMachines(pagedMachines.pageNumber, pagedMachines.pageSize),
                getAssignableUsers(),
                getWorkOrders(0, 100)
            ])

            const operators = usersRes.filter(u => u.roles.includes("OPERATOR") || u.roles.includes("SYSTEMADMIN"));
            const techs = usersRes.filter(u => u.roles.includes("TECHNICIAN") || u.roles.includes("SYSTEMADMIN"));

            setPagedMachines(machinesRes);
            setUsers(operators);
            setTechnicians(techs);
            setWorkOrders(workOrdersRes.content);

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
        return pagedMachines.content.filter(m => {
            const matchesSearch = m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.name.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesStatus = statusFilter === "ALL" || m.status === statusFilter
            const matchesType = typeFilter === "ALL" || m.type === typeFilter
            return matchesSearch && matchesStatus && matchesType
        })
    }, [pagedMachines.content, searchTerm, statusFilter, typeFilter])

    useEffect(() => {
        loadData(pagedMachines.content.length === 0)
        const interval = setInterval(() => loadData(false), 15000)
        return () => clearInterval(interval)
    }, [pagedMachines.pageNumber, pagedMachines.pageSize])

    useEffect(() => {
        setPagedMachines(prev => prev.pageNumber === 0 ? prev : ({ ...prev, pageNumber: 0 }))
    }, [searchTerm, statusFilter, typeFilter])

    return (
        <div className="page-container">
            <Background />

            {isLoading && <LoadingSpinner />}

            {!isLoading &&
                <div className="page-card space-y-4 sm:space-y-5">

                    <Title page="machine" />

                    <MachineStatsCard machines={pagedMachines.content} />

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
                        <div className="text-left text-cud-vermillon text-sm font-medium">{error}</div>
                    }

                    {pagedMachines.totalElements === 0 && (
                        <div className="text-left text-slate-400 text-sm font-medium">Még nincs rögzítve gép a rendszerben.</div>
                    )}

                    {pagedMachines.totalElements > 0 && filteredMachines.length === 0 && (
                        <div className="text-left text-slate-400 text-sm font-medium">Nem található a keresési feltételeknek megfelelő gép.</div>
                    )}

                    {filteredMachines.length > 0 && (
                        <Pagination
                            pageNumber={pagedMachines.pageNumber}
                            pageSize={pagedMachines.pageSize}
                            totalElements={pagedMachines.totalElements}
                            totalPages={pagedMachines.totalPages}
                            first={pagedMachines.first}
                            last={pagedMachines.last}
                            onPageChange={(newPageNumber) => {
                                setPagedMachines(prev => ({ ...prev, pageNumber: newPageNumber }))
                            }}
                            onPageSizeChange={(newPageSize) => {
                                setPagedMachines(prev => ({ ...prev, pageSize: newPageSize, pageNumber: 0 }))
                            }}
                        >
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
                        </Pagination>
                    )}
                </div>
            }
        </div>
    )
}