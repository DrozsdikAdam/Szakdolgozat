import { useEffect, useState } from "react"
import type { AdjustModalProps } from "../../../types/inventory/inventoryProps"
import { Pencil } from "lucide-react"
import { adjustStock } from "../../../services/inventoryService"
import type { InventoryUpdateRequest } from "../../../types/inventory/inventory"
import { Modal } from "../../common/Modal"
import { validateNonNegativeNumber, validateRequired } from "../../../utils/validators"
import { InputField } from "../../common/form/InputField"

export const AdjustInventory = ({ inventory, isOpen, closeModal, onUpdate }: AdjustModalProps) => {
    const [quantity, setQuantity] = useState<number>(0)
    const [location, setLocation] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    const isValid = (): boolean => {
        if (!inventory) return false

        const err = validateRequired(quantity.toString(), "készlet")
            || validateRequired(location, "raktárhely")
            || validateNonNegativeNumber(quantity, "készlet");

        if (err) {
            setError(err)
            return false
        }

        if (quantity === inventory.quantity && location === inventory.location) {
            setError("A készlet és a raktárhely nem változott.")
            return false
        }

        return true
    }

    const handleSubmit = async () => {
        if (!inventory || !inventory.productId || !isValid()) return
        setIsLoading(true)
        setError(null)

        const newQuantity = quantity - inventory.quantity

        const req: InventoryUpdateRequest = {
            productId: inventory.productId,
            amount: newQuantity,
            location: location || undefined
        }

        try {
            await adjustStock(req)
            onUpdate()
            closeModal()
        } catch (error) {
            setError(error instanceof Error ? error.message : String(error))
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (inventory) {
            setQuantity(inventory.quantity)
            setLocation(inventory.location)
            setError(null)
        }
    }, [inventory, isOpen])

    if (!isOpen || !inventory) return null

    return (
        <Modal
            isOpen={isOpen}
            onClose={closeModal}
            title={`Készlet módosítása - ${inventory.productName || ""}`}
            submitIcon={<Pencil size={16} />}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            submitText="Mentés"
            cancelText="Mégse"
        >
            <InputField
                label="Készlet"
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
            />
            <InputField
                label="Raktárhely"
                placeholder="Pl. A-12-03"
                value={location ?? ""}
                onChange={(e) => setLocation(e.target.value || null)}
            />
        </Modal>
    )
}