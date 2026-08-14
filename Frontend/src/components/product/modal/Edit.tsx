import { Pencil } from "lucide-react"
import type { ProductUpdateRequest } from "../../../types/product/Product"
import { useState, useEffect } from "react"
import { updateProduct } from "../../../services/productService"
import { validateMaxLength, validateMinLength, validateRequired } from "../../../utils/validators"
import type { EditModalProps } from "../../../types/product/ProductProps"
import { Modal } from "../../common/Modal"



export const EditModal = ({ product, isOpen, onClose, onSuccess }: EditModalProps) => {

    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [formEditData, setFormEditData] = useState<ProductUpdateRequest>({
        name: "",
        sku: "",
        description: "",
        unit: ""
    })

    useEffect(() => {
        if (product) {
            setFormEditData({
                name: product.name,
                sku: product.sku,
                description: product.description || "",
                unit: product.unit
            })
        }
    }, [product])

    if (!isOpen || !product) return null;

    function isValid(): boolean {
        const MIN_NAME_LENGTH = 5;
        const MIN_UNIT_LENGTH = 2;
        const MAX_DESC_LENGTH = 50;

        const error = validateRequired(formEditData.sku, "cikkszám")
            || validateMinLength(formEditData.name, MIN_NAME_LENGTH, "cikk megnevezése")
            || validateMinLength(formEditData.unit, MIN_UNIT_LENGTH, "mértékegység")
            || validateMaxLength(formEditData.description, MAX_DESC_LENGTH, "leírás")

        if (error) {
            setError(error)
            return false
        }

        return true
    }

    const handleSubmit = async () => {
        setError(null)

        if (!isValid()) return
        setIsLoading(true)

        try {
            await updateProduct(product.id, formEditData)
            onClose()
            onSuccess()
        } catch (error) {
            setError(error instanceof Error ? error.message : String(error))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Termék módosítása"
            submitIcon={<Pencil size={16} />}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            submitText="Mentés"
            cancelText="Mégsem"
        >
            <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Cikkszám</label>
                <input
                    type="text"
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/40 border border-slate-700/60 text-slate-400 text-sm cursor-not-allowed font-mono"
                    value={formEditData.sku || ""}
                />
            </div>

            <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Cikk megnevezése</label>
                <input
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                    type="text"
                    value={formEditData.name || ""}
                    onChange={(e) => setFormEditData({ ...formEditData, name: e.target.value })}
                />
            </div>

            <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Leírás</label>
                <textarea
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all resize-none"
                    rows={2}
                    value={formEditData.description || ""}
                    onChange={(e) => setFormEditData({ ...formEditData, description: e.target.value })}
                />
            </div>

            <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Mértékegység</label>
                <input
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                    type="text"
                    value={formEditData.unit || ""}
                    onChange={(e) => setFormEditData({ ...formEditData, unit: e.target.value })}
                />
            </div>
        </Modal>
    )
}