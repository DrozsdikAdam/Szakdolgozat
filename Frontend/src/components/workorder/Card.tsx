import type { WorkOrderCardProps } from "../../types/workorder/workOrderProps"
import { WorkOrderPriorityBadge, WorkOrderStatusBadge } from "../common/Badges"
import { SelectField } from "../common/form/SelectField"
import { WorkOrderActionButton } from "./Buttons"
import { Pencil } from "lucide-react"

export const WorkOrderCard = ({ order, onUpdateStatus, onEditOrder, users, onAssignUser }: WorkOrderCardProps) => {

    const isCompleted = order.status === "COMPLETED" || order.status === "CANCELLED"

    const formatDate = (dateString?: string | null) => {
        if (!dateString) return "-"
        return new Date(dateString).toLocaleDateString("hu-HU", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })
    }

    const Header = () => {
        return (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div className="space-y-0.5">
                    <div className="flex items-center gap-3">
                        <h3 className="text-slate-100 font-bold text-lg tracking-wide">{order.orderNumber}</h3>
                        <button
                            onClick={() => onEditOrder(order)}
                            title="Rendelés szerkesztése"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-all border border-slate-700/60"
                        >
                            <Pencil size={15} />
                        </button>
                    </div>
                    <p className="text-slate-400 text-xs font-medium">Megrendelő: <span className="text-slate-300 font-semibold">{order.customerName}</span></p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <WorkOrderPriorityBadge priority={order.priority} />
                    <WorkOrderStatusBadge status={order.status} />
                </div>
            </div>
        )
    }

    const InfoGrid = () => {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs py-1">
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                    <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
                        <span>Termék adatok</span>
                    </div>
                    <div className="text-slate-200 font-medium truncate">{order.productName}</div>
                    <div className="text-slate-400">SKU: <span className="text-slate-300 font-mono">{order.productSku}</span></div>
                </div>

                <div className="space-y-1.5 p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                    <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
                        <span>Felelős & Selejt</span>
                    </div>

                    {isCompleted ? (
                        <div className="text-slate-200 font-medium">{order.assignedUserName || "Nincs felelős"}</div>
                    ) : (
                        <SelectField
                            value={order.assignedUserId || ""}
                            onChange={(e) => {
                                const selectedUserId = e.target.value
                                if (selectedUserId && selectedUserId !== order.assignedUserId) {
                                    onAssignUser(order.id, selectedUserId)
                                }
                            }}
                            placeholderOption="-- Nincs felelős --"
                        >
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>{user.username}</option>
                            ))}
                        </SelectField>
                    )}
                    <div className="text-slate-400">Selejt: <span className="text-rose-400 font-bold">{order.scrapQuantity} db</span></div>
                </div>

                <div className="space-y-1.5 p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                    <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
                        <span>Időbélyegek</span>
                    </div>
                    <div className="text-slate-400">Kezdés: <span className="text-slate-300">{formatDate(order.startDate)}</span></div>
                    <div className="text-slate-400">Befejezés: <span className="text-slate-300">{formatDate(order.endDate)}</span></div>
                </div>
            </div>
        )
    }

    const ProgressBar = () => {
        return (
            <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Gyártási folyamat</span>
                    <span className="text-indigo-300 font-bold">{order.goodQuantity} / {order.targetQuantity} db ({order.progressPercentage?.toFixed(0)}%)</span>
                </div>
                <div className="w-full bg-slate-800/90 h-2.5 rounded-full overflow-hidden border border-slate-700/60 p-0.5">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500 shadow-sm shadow-indigo-500/50"
                        style={{ width: `${order.progressPercentage}%` }}
                    ></div>
                </div>
            </div>
        )
    }

    const Footer = () => {
        return (
            <div className="flex items-center justify-end pt-2 border-t border-slate-800/60">
                <WorkOrderActionButton
                    status={order.status}
                    onClick={(nextStatus) => onUpdateStatus(order, nextStatus)}
                />
            </div>
        )
    }

    return (
        <div className="flex flex-col border border-slate-800 bg-slate-900/60 backdrop-blur-xl rounded-2xl p-5 shadow-xl hover:border-slate-700/80 transition-all space-y-4">
            <Header />

            <InfoGrid />

            <ProgressBar />

            <Footer />
        </div>
    )


}