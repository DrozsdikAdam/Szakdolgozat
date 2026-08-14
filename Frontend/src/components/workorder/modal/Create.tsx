import { LoaderCircle, Plus, X } from "lucide-react";
import type { CreateWorkOrderModalProps } from "../../../types/workorder/workOrderProps";
import { useState } from "react";
import type { WorkOrderPriority, WorkOrderStatus, WorkOrderCreateRequest } from "../../../types/workorder/workOrder";
import { createWorkOrder } from "../../../services/workOrderService";
import { workOrderPriorityOptions, workOrderStatusOptions } from "../../../constants/workOrder";

export const CreateWorkOrder = ({ isOpen, closeModal, products, onSuccess, users }: CreateWorkOrderModalProps) => {

    const [productId, setProductId] = useState<string>("")
    const [targetQuantity, setTargetQuantity] = useState<number>(0)
    const [customerName, setCustomerName] = useState<string>("")
    const [priority, setPriority] = useState<WorkOrderPriority>("MEDIUM")
    const [status, setStatus] = useState<WorkOrderStatus>("PLANNED")
    const [assignedUserId, setAssignedUserId] = useState<string>("")
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    const isValid = (): boolean => {
        if (!productId || !targetQuantity || !customerName || !priority || !status) {
            setError("Minden mező kitöltése kötelező")
            return false
        }
        if (targetQuantity < 1) {
            setError("A célmennyiségnek legalább 1-nek kell lennie")
            return false
        }
        if (customerName.trim().length < 3) {
            setError("A megrendelő nevének legalább 3 karakteresnek kell lennie")
            return false
        }
        if (!priority) {
            setError("A prioritásnak érvényesnek kell lennie")
            return false
        }
        if (!status) {
            setError("Az állapotnak érvényesnek kell lennie")
            return false
        }
        return true
    }

    const handleSubmit = async () => {
        if (!isValid()) return;

        setIsLoading(true);
        setError(null)

        const workOrderCreateRequest: WorkOrderCreateRequest = {
            productId,
            targetQuantity,
            customerName,
            priority,
            status,
            assignedUserId: assignedUserId ? assignedUserId : undefined
        }

        try {
            await createWorkOrder(workOrderCreateRequest)
            closeModal()
            onSuccess()
        } catch (error) {
            setError(error instanceof Error ? error.message : "Ismeretlen hiba történt")
        } finally {
            setIsLoading(false)
        }

    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between w-full pb-2 border-b border-slate-800">
                    <h1 className="text-xl font-bold text-white tracking-tight">Új gyártási rendelés létrehozása</h1>
                    <button onClick={closeModal} className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-3.5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Termék</label>
                        <select
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                            value={productId}
                            onChange={(e) => setProductId(e.target.value)}
                        >
                            <option value="">Válasszon terméket...</option>
                            {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                    {product.name} ({product.sku})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Célmennyiség</label>
                        <input
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                            type="number"
                            placeholder="50"
                            value={targetQuantity}
                            onChange={(e) => setTargetQuantity(Number(e.target.value))}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Megrendelő</label>
                        <input
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                            type="text"
                            placeholder="Pl. Fém alkatrész X"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Állapot</label>
                        <select
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as WorkOrderStatus)}
                        >
                            {workOrderStatusOptions.filter((status) => status.key !== "COMPLETED" && status.key !== "CANCELLED" && status.key !== "QUALITY_CHECK").map((status) => (
                                <option key={status.key} value={status.key}>
                                    {status.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Felelős</label>
                        <select
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                            value={assignedUserId}
                            onChange={(e) => setAssignedUserId(e.target.value)}
                        >

                            <option value={""}>-- Nincs felelős (Később rendelhető hozzá) --</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>{user.username} ({user.roles.join(", ")})</option>
                            ))}

                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Prioritás</label>
                        <select
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as WorkOrderPriority)}
                        >
                            {workOrderPriorityOptions.map((priority) => (
                                <option key={priority.key} value={priority.key}>
                                    {priority.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {error && (
                        <p className="text-rose-400 text-xs font-medium text-center pt-1 animate-in fade-in duration-200">
                            {error}
                        </p>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-all"
                        >
                            Mégse
                        </button>
                        <button
                            disabled={isLoading}
                            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            type="submit"
                        >
                            {isLoading ? (
                                <LoaderCircle className="animate-spin h-4 w-4 text-white" />
                            ) : (
                                <>
                                    <Plus size={16} />
                                    Létrehozás
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}