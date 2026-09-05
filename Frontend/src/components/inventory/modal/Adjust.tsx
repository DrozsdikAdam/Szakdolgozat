import { useEffect, useState } from "react"
import type { AdjustModalProps } from "../../../types/inventory/inventoryProps"
import { Pencil } from "lucide-react"
import { adjustStock } from "../../../services/inventoryService"
import type { InventoryResponse, InventoryUpdateRequest } from "../../../types/inventory/inventory"
import { Modal } from "../../common/modal/Modal"
import { validateNonNegativeNumber, validateRequired } from "../../../utils/validators"
import { InputField } from "../../common/form/InputField"
import { SelectField } from "../../common/form/SelectField"

export const AdjustInventory = ({ inventories, inventory, isOpen, closeModal, onUpdate }: AdjustModalProps) => {
    const [quantity, setQuantity] = useState<number>(0)
    const [location, setLocation] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedInventory, setSelectedInventory] = useState<InventoryResponse | null>(null)

    const activeInventory = inventory || selectedInventory;

    const isValid = (): boolean => {
        if (!activeInventory) return false

        const err = validateRequired(quantity.toString(), "készlet")
            || validateRequired(location, "raktárhely")
            || validateNonNegativeNumber(quantity, "készlet");

        if (err) {
            setError(err)
            return false
        }

        if (quantity === activeInventory.quantity && location === activeInventory.location) {
            setError("A készlet és a raktárhely nem változott.")
            return false
        }

        return true
    }

    const handleSubmit = async () => {
        if (!activeInventory || !activeInventory.productId || !isValid()) return
        setIsLoading(true)
        setError(null)

        const newQuantity = quantity - activeInventory.quantity

        const req: InventoryUpdateRequest = {
            productId: activeInventory.productId,
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
        if (!isOpen) return

        if (inventory) {
            setSelectedInventory(inventory)
            setQuantity(inventory.quantity)
            setLocation(inventory.location)
            setError(null)
        } else if (inventories && inventories.length > 0) {
            const initial = selectedInventory && inventories.some(i => i.id === selectedInventory.id)
                ? selectedInventory
                : inventories[0]
            setSelectedInventory(initial)
            setQuantity(initial.quantity)
            setLocation(initial.location)
            setError(null)
        }
    }, [inventory, isOpen])

    if (!isOpen) return null

    return (
        <Modal
            isOpen={isOpen}
            onClose={closeModal}
            title={activeInventory?.productName ? `Készlet módosítása - ${activeInventory.productName}` : "Készlet módosítása"}
            submitIcon={<Pencil size={16} />}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            submitText="Mentés"
            cancelText="Mégse"
        >
            {!inventory &&
                <SelectField
                    label="Termék"
                    value={selectedInventory?.id}
                    onChange={(e) => {
                        const item = inventories?.find(inv => inv.id === e.target.value) || null
                        setSelectedInventory(item)
                        if (item) {
                            setQuantity(item.quantity)
                            setLocation(item.location)
                            setError(null)
                        }
                    }}
                    options={inventories?.map(inv => ({ key: inv.id, label: `${inv.productName} (${inv.productSku})` })) || []}
                />
            }

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