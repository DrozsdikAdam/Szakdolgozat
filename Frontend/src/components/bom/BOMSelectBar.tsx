import { Plus } from "lucide-react"
import type { BOMSelectProps } from "../../types/bomProps"

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

            <button
                onClick={openAddModal}
                disabled={!selectedProductId}
                className="w-full lg:w-auto py-2 px-4 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
                <Plus size={18} />
                Összetevő hozzáadása
            </button>
        </div>
    )
}