import { LoaderCircle, Plus, X } from "lucide-react"
import type { ProductCreateRequest } from "../../../types/product/Product"
import { useState } from "react"
import { createProduct } from "../../../services/productService"

interface CreateModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export const CreateModal = ({ isOpen, onClose, onSuccess }: CreateModalProps) => {

    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [isModalError, setIsModalError] = useState<string | null>(null)
    const [formCreateData, setFormCreateData] = useState<ProductCreateRequest>({
        sku: "",
        name: "",
        description: "",
        unit: ""
    })

    if (!isOpen) return null;

    function isFormValid(): boolean {
        const MIN_NAME_LENGTH = 5;
        const MIN_UNIT_LENGTH = 2;
        const MAX_DESC_LENGTH = 50;

        if (!formCreateData.sku || formCreateData.sku.trim().length === 0) {
            setIsModalError("A cikkszám megadása kötelező.");
            return false;
        }

        if (!formCreateData.name || formCreateData.name.trim().length < MIN_NAME_LENGTH) {
            setIsModalError("A cikk megnevezésének legalább 5 karakternek kell lennie.");
            return false;
        }

        if (!formCreateData.unit || formCreateData.unit.trim().length < MIN_UNIT_LENGTH) {
            setIsModalError("A mértékegység megadása kötelező.");
            return false;
        }

        if (formCreateData.description && formCreateData.description.trim().length > MAX_DESC_LENGTH) {
            setIsModalError(`A leírás maximum ${MAX_DESC_LENGTH} karakter hosszú lehet.`);
            return false;
        }

        return true;
    }

    const handleSubmit = async () => {
        setIsModalError(null)

        if (!isFormValid()) return
        setIsLoading(true)
        try {
            await createProduct(formCreateData)
            setFormCreateData({ sku: "", name: "", description: "", unit: "" })
            onClose()
            onSuccess()
        } catch (error) {
            setIsModalError(error instanceof Error ? error.message : String(error))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between w-full pb-2 border-b border-slate-800">
                    <h1 className="text-xl font-bold text-white tracking-tight">Új termék létrehozása</h1>
                    <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-3.5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Cikkszám</label>
                        <input
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                            type="text"
                            placeholder="Pl. PROD-001"
                            value={formCreateData.sku}
                            onChange={(e) => setFormCreateData({ ...formCreateData, sku: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Cikk megnevezése</label>
                        <input
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                            type="text"
                            placeholder="Pl. Fém alkatrész X"
                            value={formCreateData.name}
                            onChange={(e) => setFormCreateData({ ...formCreateData, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Leírás</label>
                        <textarea
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all resize-none"
                            rows={2}
                            placeholder="Rövid termékleírás..."
                            value={formCreateData.description || ""}
                            onChange={(e) => setFormCreateData({ ...formCreateData, description: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Mértékegység</label>
                        <input
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                            type="text"
                            placeholder="Pl. db, kg, m"
                            value={formCreateData.unit}
                            onChange={(e) => setFormCreateData({ ...formCreateData, unit: e.target.value })}
                        />
                    </div>

                    {isModalError && (
                        <p className="text-rose-400 text-xs font-medium text-center pt-1 animate-in fade-in duration-200">
                            {isModalError}
                        </p>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-all"
                        >
                            Mégse
                        </button>
                        <button
                            disabled={isLoading}
                            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            type="submit"
                        >
                            {isLoading ? (
                                <LoaderCircle className="animate-spin h-4 w-4 text-white" />
                            ) : (
                                <>
                                    <Plus size={16} />
                                    Létrehozás
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}