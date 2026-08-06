import { useState, type FormEvent } from "react"
import type { AddBOMComponentModalProps } from "../../../types/bom/bomProps"
import { addComponentToBOMTree } from "../../../services/bomService"
import type { BOMItemRequest } from "../../../types/bom/bom"
import { LoaderCircle, Plus, X } from "lucide-react"

export const AddBOMComponent = ({ isOpen, products, onSuccess, closeModal, parentProductId }: AddBOMComponentModalProps) => {
    const [componentProductId, setComponentProductId] = useState<string | null>(null)
    const [quantity, setQuantity] = useState<number>(1)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    if (!isOpen || !parentProductId) return null

    const availableProducts = products.filter((product => product.id !== parentProductId));

    const isValid = (): boolean => {
        if (!componentProductId) {
            setError("Kérlek válassz ki egy alkatrészt")
            return false
        }
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
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
                <div className="flex justify-between items-center" >
                    <div>
                        <h2>Új alkatrész hozzáadása</h2>
                    </div>
                    <button onClick={closeModal} className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all">
                        <X size={18} />
                    </button>
                </div >

                <form onSubmit={(e: FormEvent) => { e.preventDefault(); handleSubmit(); }} className="w-full space-y-4">

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

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button disabled={isLoading}
                        className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        type="submit"
                    >
                        {isLoading ? (
                            <LoaderCircle className="animate-spin h-4 w-4 text-white" />
                        ) : (
                            <>
                                <Plus size={16} />
                                Hozzáadás
                            </>
                        )}
                    </button>

                </form>

            </div>
        </div>
    )
}