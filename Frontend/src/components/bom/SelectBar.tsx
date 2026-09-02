import { Plus } from "lucide-react"
import type { BOMSelectProps } from "../../types/bom/bomProps"
import { Can } from "../common/Can"
import { SubmitButton } from "../common/form/SubmitButton"

export const BOMSelectBar = ({ products, selectedProductId, setSelectedProductId, quantity, openAddModal, setQuantity }: BOMSelectProps) => {
    return (
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 pt-1">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <label className="text-white text-sm font-semibold whitespace-nowrap">Főtermék:</label>
                    <select
                        value={selectedProductId || ""}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        className="w-full sm:w-64 px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                    >
                        <option value="">Válasszon terméket...</option>
                        {products.map((product) => (
                            <option key={product.id} value={product.id}>
                                {product.name} ({product.sku})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <label className="text-white text-sm font-semibold whitespace-nowrap">Gyártási mennyiség (szorzó):</label>
                    <input
                        type="number"
                        min={1}
                        step={1}
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="w-24 px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                    />
                </div>
            </div>

            <Can roles={["SYSTEMADMIN", "MANAGER"]}>
                <SubmitButton
                    onClick={openAddModal}
                    disabled={!selectedProductId}
                    text="Összetevő hozzáadása"
                    icon={<Plus size={18} />}
                    className="px-5 py-2.5 rounded-xl cursor-pointer"
                />
            </Can>
        </div>
    )
}