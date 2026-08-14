import { Plus } from "lucide-react";
import type { CreateWorkOrderModalProps } from "../../../types/workorder/workOrderProps";
import { useState } from "react";
import type { WorkOrderPriority, WorkOrderStatus, WorkOrderCreateRequest } from "../../../types/workorder/workOrder";
import { createWorkOrder } from "../../../services/workOrderService";
import { workOrderPriorityOptions, workOrderStatusOptions } from "../../../constants/workOrder";
import { Modal } from "../../common/Modal"
import { validateMinLength, validatePositiveInteger, validateRequired } from "../../../utils/validators"

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

        const error = validateRequired(customerName, "megrendelő")
            || validateMinLength(customerName, 3, "megrendelő neve")
            || validatePositiveInteger(targetQuantity, "célmennyiség")

        if (error) {
            setError(error)
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
        <Modal
            title="Új gyártási rendelés létrehozása"
            isOpen={isOpen}
            onClose={closeModal}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            submitText="Létrehozás"
            submitIcon={<Plus size={18} />}
            cancelText="Mégse"
        >
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
        </Modal>
    )
}