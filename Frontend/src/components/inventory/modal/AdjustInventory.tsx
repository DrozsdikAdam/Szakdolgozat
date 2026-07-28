import { useEffect, useState, type FormEvent } from "react"
import type { AdjustModalProps } from "../../../types/inventoryProps"
import { LoaderCircle, Pencil, X } from "lucide-react"
import { adjustStock } from "../../../services/inventoryService"
import type { InventoryUpdateRequest } from "../../../types/inventory"

export const AdjustInventory = ({ inventory, isOpen, closeModal, onUpdate }: AdjustModalProps) => {

    const [quantity, setQuantity] = useState<number>(0)
    const [location, setLocation] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    const isValid = (): boolean => {
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

        const req: InventoryUpdateRequest = {
            productId: inventory.productId,
            quantity: quantity,
            location: location
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
        setQuantity(inventory.quantity)
        setLocation(inventory.location)
        setError(null)
    }, [inventory, isOpen])

    if (!isOpen || !inventory) {
        return null
    }

    return (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
                <div className="flex justify-between items-center" >
                    <div>
                        <h2>Termék: {inventory.productName}</h2>
                    </div>
                    <button onClick={closeModal} className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all">
                        <X size={18} />
                    </button>
                </div >
                <form onSubmit={(e: FormEvent) => { e.preventDefault(); handleSubmit(); }} className="w-full space-y-4">
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

                    {error && <p className="text-rose-400 text-xs font-medium text-center pt-1 animate-in fade-in duration-200">
                        {error}
                    </p>}

                    <button disabled={isLoading}
                        className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        type="submit"
                    >
                        {isLoading ? (
                            <LoaderCircle className="animate-spin h-4 w-4 text-white" />
                        ) : (
                            <>
                                <Pencil size={16} />
                                Mentés
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}