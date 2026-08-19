import { useEffect, useState } from "react";
import type { EditWorkOrderModalProps } from "../../../types/workorder/workOrderProps";
import type { WorkOrderPriority, WorkOrderUpdateRequest } from "../../../types/workorder/workOrder";
import { Pencil } from "lucide-react";
import { updateWorkOrder } from "../../../services/workOrderService";
import { workOrderPriorityOptions } from "../../../constants/workOrder";
import { Modal } from "../../common/Modal"
import { validateMinLength, validatePositiveInteger, validateRequired } from "../../../utils/validators"
import { InputField } from "../../common/form/InputField"
import { SelectField } from "../../common/form/SelectField"

export const EditWorkOrder = ({ isOpen, closeModal, order, onSuccess, users }: EditWorkOrderModalProps) => {
    const [targetQuantity, setTargetQuantity] = useState<number>(0)
    const [customerName, setCustomerName] = useState<string>("")
    const [priority, setPriority] = useState<WorkOrderPriority>("MEDIUM")
    const [assignedUserId, setAssignedUserId] = useState<string>("")
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    const isValid = (): boolean => {
        const err = validateRequired(customerName, "megrendelő")
            || validateMinLength(customerName, 3, "megrendelő neve")
            || validatePositiveInteger(targetQuantity, "célmennyiség")

        if (err) {
            setError(err)
            return false
        }
        return true
    }

    const handleSubmit = async () => {
        if (!order || !isValid()) return
        setIsLoading(true)
        setError(null)

        const updateRequest: WorkOrderUpdateRequest = {
            targetQuantity,
            customerName,
            priority,
            assignedUserId: assignedUserId || undefined
        }

        try {
            await updateWorkOrder(order.id, updateRequest)
            onSuccess()
            closeModal()
        } catch (error) {
            setError(error instanceof Error ? error.message : "Ismeretlen hiba")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (order && isOpen) {
            setTargetQuantity(order.targetQuantity)
            setCustomerName(order.customerName)
            setPriority(order.priority)
            setAssignedUserId(order.assignedUserId || "")
            setError(null)
        }
    }, [order, isOpen])

    if (!isOpen || !order) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={closeModal}
            title={`Gyártási rendelés módosítása - ${order.orderNumber}`}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            submitText="Módosítás"
            submitIcon={<Pencil size={18} />}
            cancelText="Mégse"
        >
            <InputField
                label="Termék"
                disabled
                value={`${order.productName} (${order.productSku})`}
                className="font-medium text-slate-300 bg-slate-800/50 cursor-not-allowed"
            />

            <InputField
                label="Célmennyiség"
                type="number"
                min={1}
                value={targetQuantity}
                onChange={(e) => setTargetQuantity(Number(e.target.value))}
            />

            <InputField
                label="Megrendelő"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
            />

            <SelectField
                label="Felelős"
                value={assignedUserId}
                onChange={(e) => setAssignedUserId(e.target.value)}
            >
                <option value="">-- Nincs felelős (Később rendelhető hozzá) --</option>
                {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.username} ({user.roles.join(", ")})</option>
                ))}
            </SelectField>

            <SelectField
                label="Prioritás"
                options={workOrderPriorityOptions}
                value={priority}
                onChange={(e) => setPriority(e.target.value as WorkOrderPriority)}
            />
        </Modal>
    )
}