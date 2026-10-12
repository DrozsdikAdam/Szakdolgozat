import { useEffect, useMemo, useState } from "react"
import { Background } from "../components/common/Background"
import type { WorkOrderPriority, WorkOrderResponse, WorkOrderStatus, WorkOrderStatusUpdateRequest } from "../types/workorder/workOrder"
import type { ProductResponse } from "../types/product/Product"
import type { UserResponse } from "../types/user/User"
import { LoadingSpinner } from "../components/common/LoadingSpinner"
import { getActiveProducts } from "../services/productService"
import { getWorkOrders, updateWorkOrderStatus, updateWorkOrderUser } from "../services/workOrderService"
import { EditWorkOrder } from "../components/workorder/modal/Edit"
import { CreateWorkOrder } from "../components/workorder/modal/Create"
import { getAssignableUsers } from "../services/userService"
import { Title } from "../components/common/Title"
import { WorkOrderStatsCard } from "../components/workorder/StatsCard"
import { WorkOrderFilterBar } from "../components/workorder/FilterBar"
import { WorkOrderCard } from "../components/workorder/Card"
import type { PagedResponse } from "../types/common/PagedResponse"
import { Pagination } from "../components/common/Pagination"

export const WorkOrderView = () => {

    const [products, setProducts] = useState<ProductResponse[]>([])
    const [pagedOrders, setPagedOrders] = useState<PagedResponse<WorkOrderResponse>>({
        content: [],
        pageNumber: 0,
        pageSize: 10,
        totalPages: 0,
        totalElements: 0,
        first: true,
        last: true
    })
    const [users, setUsers] = useState<UserResponse[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    const [searchTerm, setSearchTerm] = useState<string>("")
    const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | "ALL">("ALL")
    const [priorityFilter, setPriorityFilter] = useState<WorkOrderPriority | "ALL">("ALL")
    const [workOrderUserFilter, setWorkOrderUserFilter] = useState<string | "ALL" | "UNASSIGNED">("ALL")

    const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false)
    const [selectedEditOrder, setSelectedEditOrder] = useState<WorkOrderResponse | null>(null)

    const handleUpdateStatus = async (order: WorkOrderResponse, newStatus: WorkOrderStatus) => {
        setError(null)
        if (newStatus !== "PLANNED" && newStatus !== "CANCELLED" && (!order.assignedUserId || !order.assignedUserName)) {
            setError("A gyártási folyamat nem indítható el felelős operátor hozzárendelése nélkül! Kérjük, előbb rendeljen hozzá felelőst a Szerkesztés (ceruza) gombra kattintva.")
            return
        }
        setIsLoading(true)
        setError(null)
        const producedQuantity = newStatus === "COMPLETED"
            ? ((order.producedQuantity && order.producedQuantity > 0) ? order.producedQuantity : order.targetQuantity)
            : (order.producedQuantity ?? 0);

        const request: WorkOrderStatusUpdateRequest = {
            status: newStatus,
            producedQuantity: producedQuantity,
            scrapQuantity: order.scrapQuantity ?? 0
        }

        try {
            await updateWorkOrderStatus(order.id, request)
            loadData()
        } catch (error) {
            setError(error instanceof Error ? error.message : "Ismeretlen hiba történt")
        } finally {
            setIsLoading(false)
        }

    }

    const loadData = async (showSpinner: boolean = true) => {
        if (showSpinner) setIsLoading(true)
        setError(null)

        try {
            if (!navigator.onLine) {
                const ordersData = await getWorkOrders(pagedOrders.pageNumber, pagedOrders.pageSize, statusFilter)
                setPagedOrders(ordersData)
                return
            }

            let [productsData, ordersData, usersData] = await Promise.all([
                getActiveProducts(),
                getWorkOrders(pagedOrders.pageNumber, pagedOrders.pageSize, statusFilter),
                getAssignableUsers()
            ])
            setProducts(productsData)
            setPagedOrders(ordersData)
            setUsers(usersData)

        } catch (error) {
            if (!navigator.onLine || (error instanceof TypeError && error.message.includes("fetch"))) {
                try {
                    const ordersData = await getWorkOrders(pagedOrders.pageNumber, pagedOrders.pageSize, statusFilter)
                    setPagedOrders(ordersData)
                    return
                } catch {

                }
            }
            setError(error instanceof Error ? error.message : "Ismeretlen hiba történt")
        } finally {
            setIsLoading(false)
        }
    }

    const filteredOrders = useMemo(() => {
        let filtered = [...pagedOrders.content]
        if (statusFilter !== "ALL")
            filtered = filtered.filter(order => order.status === statusFilter)

        if (priorityFilter !== "ALL")
            filtered = filtered.filter(order => order.priority === priorityFilter)

        if (workOrderUserFilter === "UNASSIGNED")
            filtered = filtered.filter(order => !order.assignedUserId)
        else if (workOrderUserFilter !== "ALL")
            filtered = filtered.filter(order => order.assignedUserId === workOrderUserFilter)

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase().trim()
            filtered = filtered.filter(order =>
                order.orderNumber.toLowerCase().includes(term) ||
                order.productName.toLowerCase().includes(term) ||
                order.customerName.toLowerCase().includes(term) ||
                order.productSku.toLowerCase().includes(term) ||
                order.assignedUserName?.toLowerCase().includes(term)
            )
        }
        return filtered
    }, [pagedOrders.content, statusFilter, priorityFilter, workOrderUserFilter, searchTerm])

    const activeWorkers = useMemo(() => {
        const workerMap = new Map<string, string>()
        pagedOrders.content.forEach(order => {
            if (order.assignedUserId && order.assignedUserName) {
                workerMap.set(order.assignedUserId, order.assignedUserName)
            }
        })
        return Array.from(workerMap.entries()).map(([id, username]) => ({ id, username }))
    }, [pagedOrders.content])

    const handleAssignUser = async (orderId: string, userId: string): Promise<void> => {
        setError(null)
        setIsLoading(true)
        try {
            await updateWorkOrderUser(orderId, userId)
            loadData()
        } catch (error) {
            setError(error instanceof Error ? error.message : "Ismeretlen hiba történt")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadData(true)
        const interval = setInterval(() => loadData(false), 5000)
        return () => clearInterval(interval)
    }, [pagedOrders.pageNumber, pagedOrders.pageSize, statusFilter])

    useEffect(() => {
        setPagedOrders(prev => ({ ...prev, pageNumber: 0 }))
    }, [statusFilter, priorityFilter, workOrderUserFilter, searchTerm])

    return (
        <div className="page-container">
            <Background />

            <CreateWorkOrder isOpen={isCreateOpen} closeModal={() => setIsCreateOpen(false)} products={products} users={users} onSuccess={loadData} />

            <EditWorkOrder isOpen={!!selectedEditOrder} closeModal={() => setSelectedEditOrder(null)} order={selectedEditOrder} users={users} onSuccess={loadData} />

            {isLoading && <LoadingSpinner />}

            <div className="page-card space-y-4 sm:space-y-5">

                <Title page="workorder" />

                <WorkOrderStatsCard orders={pagedOrders.content} />

                <WorkOrderFilterBar
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    priorityFilter={priorityFilter}
                    setPriorityFilter={setPriorityFilter}
                    openCreateModal={() => setIsCreateOpen(true)}
                    workOrderUserFilter={workOrderUserFilter}
                    setWorkOrderUserFilter={setWorkOrderUserFilter}
                    activeWorkers={activeWorkers}
                />

                {error &&
                    <div className="text-left text-cud-vermillon text-sm font-medium">{error}</div>
                }

                {filteredOrders.length === 0 &&
                    <div className="text-left text-slate-400 text-sm font-medium">Nem található a keresési feltételeknek megfelelő gyártási rendelés.</div>
                }

                {filteredOrders.length > 0 && (
                    <Pagination
                        pageNumber={pagedOrders.pageNumber}
                        pageSize={pagedOrders.pageSize}
                        totalElements={pagedOrders.totalElements}
                        totalPages={pagedOrders.totalPages}
                        first={pagedOrders.first}
                        last={pagedOrders.last}
                        onPageChange={(newPageNumber) => {
                            const newPage = { ...pagedOrders, pageNumber: newPageNumber }
                            setPagedOrders(newPage)
                        }}
                        onPageSizeChange={(newPageSize) => {
                            const newPage = { ...pagedOrders, pageSize: newPageSize }
                            setPagedOrders(newPage)
                        }}
                    >
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {filteredOrders.map((order) => (
                                <WorkOrderCard
                                    key={order.id}
                                    order={order}
                                    users={users}
                                    onUpdateStatus={handleUpdateStatus}
                                    onEditOrder={(ord) => setSelectedEditOrder(ord)}
                                    onAssignUser={handleAssignUser}
                                />
                            ))}
                        </div>
                    </Pagination>
                )}
            </div>
        </div>
    )
}
