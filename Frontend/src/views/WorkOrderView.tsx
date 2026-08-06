import { useEffect, useMemo, useState } from "react"
import { Background } from "../components/Background"
import type { WorkOrderPriority, WorkOrderResponse, WorkOrderStatus, WorkOrderStatusUpdateRequest } from "../types/workorder/workOrder"
import type { ProductResponse } from "../types/product/Product"
import type { UserResponse } from "../types/user/User"
import { LoadingSpinner } from "../components/LoadingSpinner"
import { getProducts } from "../services/productService"
import { getAllWorkOrders, updateWorkOrderStatus } from "../services/workOrderService"
import { EditWorkOrder } from "../components/workorder/modal/Edit"
import { CreateWorkOrder } from "../components/workorder/modal/Create"
import { getAssignableUsers } from "../services/userService"
import { Title } from "../components/Title"
import { WorkOrderStatsCard } from "../components/workorder/StatsCard"
import { WorkOrderFilterBar } from "../components/workorder/FilterBar"
import { WorkOrderCard } from "../components/workorder/Card"

export const WorkOrderView = () => {

    const [products, setProducts] = useState<ProductResponse[]>([])
    const [orders, setOrders] = useState<WorkOrderResponse[]>([])
    const [users, setUsers] = useState<UserResponse[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    const [searchTerm, setSearchTerm] = useState<string>("")
    const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | "ALL">("ALL")
    const [priorityFilter, setPriorityFilter] = useState<WorkOrderPriority | "ALL">("ALL")

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
        const producedQuantity = newStatus === "COMPLETED" ? order.targetQuantity : order.producedQuantity;

        const request: WorkOrderStatusUpdateRequest = {
            status: newStatus,
            producedQuantity: producedQuantity,
            scrapQuantity: order.scrapQuantity
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

    const loadData = async () => {
        setIsLoading(true)
        setError(null)
        try {
            let [productsData, ordersData, usersData] = await Promise.all([
                getProducts(),
                getAllWorkOrders(),
                getAssignableUsers()
            ])
            setProducts(productsData)
            setOrders(ordersData)
            setUsers(usersData)

        } catch (error) {
            setError(error instanceof Error ? error.message : "Ismeretlen hiba történt")
        } finally {
            setIsLoading(false)
        }
    }

    const filteredOrders = useMemo(() => {
        let filtered = [...orders]
        if (statusFilter !== "ALL") {
            filtered = filtered.filter(order => order.status === statusFilter)
        }
        if (priorityFilter !== "ALL") {
            filtered = filtered.filter(order => order.priority === priorityFilter)
        }
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
    }, [orders, statusFilter, priorityFilter, searchTerm])

    useEffect(() => {
        loadData()
    }, [])

    return (
        <div className="relative flex-1 w-full flex flex-col items-center justify-start p-4 sm:p-6 font-sans">
            <Background />

            <CreateWorkOrder isOpen={isCreateOpen} closeModal={() => setIsCreateOpen(false)} products={products} users={users} onSuccess={loadData} />

            <EditWorkOrder isOpen={!!selectedEditOrder} closeModal={() => setSelectedEditOrder(null)} order={selectedEditOrder} users={users} onSuccess={loadData} />

            {isLoading && <LoadingSpinner />}

            <div className="w-full max-w-7xl backdrop-blur-xl bg-slate-900/60 border border-slate-800 shadow-2xl rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 relative z-10">

                <Title page="workorder" />

                <WorkOrderStatsCard orders={orders} />

                <WorkOrderFilterBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} statusFilter={statusFilter} setStatusFilter={setStatusFilter} priorityFilter={priorityFilter} setPriorityFilter={setPriorityFilter} openCreateModal={() => setIsCreateOpen(true)} />

                {error &&
                    <div className="text-left text-red-400 text-sm font-medium">{error}</div>
                }

                {filteredOrders.length === 0 &&
                    <div className="text-left text-slate-400 text-sm font-medium">Nem található a keresési feltételeknek megfelelő gyártási rendelés.</div>
                }

                {filteredOrders.length > 0 && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {filteredOrders.map((order) => (
                            <WorkOrderCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} onEditOrder={(ord) => setSelectedEditOrder(ord)} />
                        ))}
                    </div>
                )}

            </div>
        </div>
    )
}
