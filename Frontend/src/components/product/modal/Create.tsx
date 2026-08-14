import { Plus } from "lucide-react"
import type { ProductCreateRequest } from "../../../types/product/Product"
import { useState } from "react"
import { createProduct } from "../../../services/productService"
import { Modal } from "../../common/Modal"
import { validateRequired } from "../../../utils/validators"
import type { CreateModalProps } from "../../../types/product/ProductProps"


export const CreateModal = ({ isOpen, onClose, onSuccess }: CreateModalProps) => {

    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [isModalError, setIsModalError] = useState<string | null>(null)
    const [formCreateData, setFormCreateData] = useState<ProductCreateRequest>({
        sku: "",
        name: "",
        description: "",
        unit: ""
    })



    function isValid(): boolean {
        const MIN_NAME_LENGTH = 5;
        const MIN_UNIT_LENGTH = 2;
        const MAX_DESC_LENGTH = 50;

        const err = validateRequired(formCreateData.sku, "cikkszám")
            || validateRequired(formCreateData.name, "cikk megnevezése")
            || validateRequired(formCreateData.unit, "mértékegység")
            || validateRequired(formCreateData.description, "leírás");
        if (err) { setIsModalError(err); return false; }

        if (formCreateData.sku.trim().length === 0) {
            setIsModalError("A cikkszám megadása kötelező.");
            return false;
        }

        if (formCreateData.name.trim().length < MIN_NAME_LENGTH) {
            setIsModalError("A cikk megnevezésének legalább 5 karakternek kell lennie.");
            return false;
        }

        if (formCreateData.unit.trim().length < MIN_UNIT_LENGTH) {
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

        if (!isValid()) return
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

    if (!isOpen) return null;

    return (
        <Modal
            title="Új termék létrehozása"
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={isModalError}
            submitText="Létrehozás"
            submitIcon={<Plus size={18} />}
            cancelText="Mégse"
        >
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
        </Modal>
    )
}