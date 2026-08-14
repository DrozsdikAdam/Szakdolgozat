import { useEffect, useState } from "react"
import type { AdjustModalProps } from "../../../types/inventory/inventoryProps"
import { Pencil } from "lucide-react"
import { adjustStock } from "../../../services/inventoryService"
import type { InventoryUpdateRequest } from "../../../types/inventory/inventory"
import { Modal } from "../../common/Modal"
import { validateRequired } from "../../../utils/validators"

export const AdjustInventory = ({ inventory, isOpen, closeModal, onUpdate }: AdjustModalProps) => {

    const [quantity, setQuantity] = useState<number>(0)
    const [location, setLocation] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    const isValid = (): boolean => {
        const err = validateRequired(quantity.toString(), "készlet")
            || validateRequired(location, "raktárhely");
        if (err) { setError(err); return false; }

        if (quantity < 0) {
            setError("A készlet nem lehet negatív.")
            return false
        }
        if (quantity === inventory.quantity && location === inventory.location) {
            setError("A készlet és a raktárhely nem változott.")
            return false
        }

        return true
    }

    const handleSubmit = async () => {
        if (!isValid()) return
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

    if (!isOpen || !inventory) {
        return null
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={closeModal}
            title="Termék módosítása"
            submitIcon={<Pencil size={16} />}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            submitText="Mentés"
            cancelText="Mégsem"
        >
            <div className="w-full flex flex-col items-center p-2">
                <label htmlFor="quantity" className="text-white font-bold">Készlet</label>
                <input
                    type="number"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                    value={quantity}
                    onChange={(e) => { setQuantity(Number(e.target.value)) }} />
            </div>

            <div className="w-full flex flex-col items-center p-2">
                <label htmlFor="location" className="text-white font-bold">Raktárhely</label>
                <input
                    type="text"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                    value={location ?? ""}
                    onChange={(e) => { setLocation(e.target.value || null) }} />
            </div>
        </Modal>
    )
}