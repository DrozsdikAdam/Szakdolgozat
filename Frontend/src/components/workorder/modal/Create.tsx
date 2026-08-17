import { Plus } from "lucide-react";
import type { CreateWorkOrderModalProps } from "../../../types/workorder/workOrderProps";
import { useState } from "react";
import type { WorkOrderPriority, WorkOrderStatus, WorkOrderCreateRequest } from "../../../types/workorder/workOrder";
import { createWorkOrder } from "../../../services/workOrderService";
import { workOrderPriorityOptions, workOrderStatusOptions } from "../../../constants/workOrder";
import { Modal } from "../../common/Modal"
import { validateMinLength, validatePositiveInteger, validateRequired } from "../../../utils/validators"
import { InputField } from "../../common/form/InputField"
import { SelectField } from "../../common/form/SelectField"

export const CreateWorkOrder = ({ isOpen, closeModal, products, onSuccess, users }: CreateWorkOrderModalProps) => {
    const [productId, setProductId] = useState<string>("")
    const [targetQuantity, setTargetQuantity] = useState<number>(50)
    const [customerName, setCustomerName] = useState<string>("")
    const [status, setStatus] = useState<WorkOrderStatus>("PLANNED")
    const [priority, setPriority] = useState<WorkOrderPriority>("MEDIUM")
    const [assignedUserId, setAssignedUserId] = useState<string>("")
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    const isValid = (): boolean => {
        const err = validateRequired(productId, "termék")
            || validateRequired(customerName, "megrendelő")
            || validateMinLength(customerName, 3, "megrendelő neve")
            || validatePositiveInteger(targetQuantity, "célmennyiség")

        if (err) {
            setError(err)
            return false
        }
        return true
    }

    const handleSubmit = async () => {
        if (!isValid()) return
        setError(null)
        setIsLoading(true)

        const workOrderCreateRequest: WorkOrderCreateRequest = {
            productId,
            targetQuantity,
            customerName,
            status,
            priority,
            assignedUserId: assignedUserId || undefined
        }

        try {
            await createWorkOrder(workOrderCreateRequest)
            onSuccess()
            closeModal()
        } catch (error) {
            setError(error instanceof Error ? error.message : "Ismeretlen hiba")
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
            <SelectField
                label="Termék"
                placeholderOption="Válasszon terméket..."
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
            >
                {products.map((product) => (
                    <option key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                    </option>
                ))}
            </SelectField>

            <InputField
                label="Célmennyiség"
                type="number"
                min={1}
                value={targetQuantity}
                onChange={(e) => setTargetQuantity(Number(e.target.value))}
            />

            <InputField
                label="Megrendelő"
                placeholder="Pl. Fém alkatrész X"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
            />

            <SelectField
                label="Állapot"
                options={workOrderStatusOptions.filter((s) => s.key !== "COMPLETED" && s.key !== "CANCELLED" && s.key !== "QUALITY_CHECK")}
                value={status}
                onChange={(e) => setStatus(e.target.value as WorkOrderStatus)}
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