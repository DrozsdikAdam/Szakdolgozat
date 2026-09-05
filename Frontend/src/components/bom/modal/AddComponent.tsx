import { useState } from "react"
import type { AddBOMComponentModalProps } from "../../../types/bom/bomProps"
import { addComponentToBOMTree } from "../../../services/bomService"
import type { BOMItemRequest } from "../../../types/bom/bom"
import { Plus } from "lucide-react"
import { Modal } from "../../common/modal/Modal"
import { validateRequired, validatePositiveNumber } from "../../../utils/validators"
import { SelectField } from "../../common/form/SelectField"
import { InputField } from "../../common/form/InputField"

export const AddBOMComponent = ({ isOpen, products, onSuccess, closeModal, parentProductId }: AddBOMComponentModalProps) => {
    const [componentProductId, setComponentProductId] = useState<string | null>(null)
    const [quantity, setQuantity] = useState<number>(1)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    if (!isOpen || !parentProductId) return null

    const availableProducts = products.filter((product => product.id !== parentProductId));

    const isValid = (): boolean => {
        const err = validateRequired(componentProductId, "alkatrész")
            || validatePositiveNumber(quantity, "mennyiség");
        if (err) { setError(err); return false; }
        return true
    }

    const handleSubmit = async () => {
        if (!isValid() || !componentProductId) return
        setError(null)
        setIsLoading(true)

        const request: BOMItemRequest = {
            parentProductId,
            componentProductId,
            quantity
        }

        try {
            await addComponentToBOMTree(request)
            onSuccess()
            setComponentProductId(null)
            setQuantity(1)
            closeModal()
        } catch (error) {
            setError(error instanceof Error ? error.message : "Hozzáadás sikertelen")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={closeModal}
            title="Új alkatrész hozzáadása"
            submitIcon={<Plus size={16} />}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            submitText="Hozzáadás"
            cancelText="Mégse"
        >
            <SelectField
                label="Alkatrész"
                placeholderOption="Válassz alkatrészt..."
                value={componentProductId || ""}
                onChange={(e) => setComponentProductId(e.target.value || null)}
            >
                {availableProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                    </option>
                ))}
            </SelectField>

            <InputField
                label="Mennyiség"
                type="number"
                min={1}
                step={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
            />
        </Modal>
    )
}