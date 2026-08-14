import { useState } from "react"
import type { AddBOMComponentModalProps } from "../../../types/bom/bomProps"
import { addComponentToBOMTree } from "../../../services/bomService"
import type { BOMItemRequest } from "../../../types/bom/bom"
import { Plus } from "lucide-react"
import { Modal } from "../../common/Modal"
import { validateRequired } from "../../../utils/validators"

export const AddBOMComponent = ({ isOpen, products, onSuccess, closeModal, parentProductId }: AddBOMComponentModalProps) => {
    const [componentProductId, setComponentProductId] = useState<string | null>(null)
    const [quantity, setQuantity] = useState<number>(1)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    if (!isOpen || !parentProductId) return null

    const availableProducts = products.filter((product => product.id !== parentProductId));

    const isValid = (): boolean => {
        const err = validateRequired(componentProductId, "alkatrész")
            || validateRequired(quantity.toString(), "mennyiség");
        if (err) { setError(err); return false; }

        if (quantity <= 0) {
            setError("A darabszámnak nagyobbnak kell lennie mint 0")
            return false
        }
        return true
    }

    const handleSubmit = async () => {
        if (!isValid()) return
        setError(null)
        setIsLoading(true)
        if (!componentProductId) return

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
            setError(null)
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
            cancelText="Mégsem"
        >
            <div className="w-full flex flex-col items-center p-2">
                <label htmlFor="componentProductId" className="text-white font-bold">Alkatrész</label>
                <select
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                    value={componentProductId || ""}
                    onChange={(e) => { setComponentProductId(e.target.value || null) }} >
                    <option value="">Válassz alkatrészt</option>
                    {availableProducts.map((product) => (
                        <option key={product.id} value={product.id}>
                            {product.name} ({product.sku})
                        </option>
                    ))}
                </select>
            </div>

            <div className="w-full flex flex-col items-center p-2">
                <label htmlFor="quantity" className="text-white font-bold">Mennyiség</label>
                <input
                    min={1}
                    step={1}
                    type="number"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                    value={quantity}
                    onChange={(e) => { setQuantity(Number(e.target.value)) }} />
            </div>
        </Modal>
    )
}