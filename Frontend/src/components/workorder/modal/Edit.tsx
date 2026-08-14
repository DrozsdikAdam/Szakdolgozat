import { useEffect, useState } from "react";
import type { EditWorkOrderModalProps } from "../../../types/workorder/workOrderProps";
import type { WorkOrderPriority, WorkOrderUpdateRequest } from "../../../types/workorder/workOrder";
import { Pencil } from "lucide-react";
import { updateWorkOrder } from "../../../services/workOrderService";
import { workOrderPriorityOptions } from "../../../constants/workOrder";
import { Modal } from "../../common/Modal"
import { validateMinLength, validatePositiveInteger, validateRequired } from "../../../utils/validators"

export const EditWorkOrder = ({ isOpen, closeModal, order, onSuccess, users }: EditWorkOrderModalProps) => {

    const [targetQuantity, setTargetQuantity] = useState<number>(0)
    const [customerName, setCustomerName] = useState<string>("")
    const [priority, setPriority] = useState<WorkOrderPriority>("LOW")
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
        if (!order) return;
        setError(null);
        if (!isValid()) return;
        setIsLoading(true);
        const request: WorkOrderUpdateRequest = {
            targetQuantity,
            customerName,
            priority,
            assignedUserId: assignedUserId || undefined
        }
        try {
            await updateWorkOrder(order.id, request)
            onSuccess()
            closeModal()
        } catch (error) {
            setError(error instanceof Error ? error.message : "Ismeretlen hiba történt")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (isOpen && order) {
            setTargetQuantity(order.targetQuantity);
            setCustomerName(order.customerName);
            setPriority(order.priority);
            setAssignedUserId(order.assignedUserId || "");
        }
    }, [isOpen, order])

    if (!isOpen || !order) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={closeModal}
            title="Gyártási rendelés módosítása"
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            submitText="Módosítás"
            submitIcon={<Pencil size={18} />}
            cancelText="Mégse"
        >
            <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Termék</label>
                <p className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all">
                    {order.productName} ({order.productSku})
                </p>
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