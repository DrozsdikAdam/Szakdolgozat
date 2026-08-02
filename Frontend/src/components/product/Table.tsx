import type { TableProps } from "../../types/product/ProductProps"
import { OperationButtons } from "./OperationButtons"

export const Table = ({ products, activeTab, loadProducts, openModal, setError, setIsLoading }: TableProps) => {
    return (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40 shadow-inner">
            <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-800/80 border-b border-slate-700/60 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                    <tr>
                        <th className="px-4 py-2.5 text-left">Cikkszám</th>
                        <th className="px-4 py-2.5 text-left">Terméknév</th>
                        <th className="px-4 py-2.5 text-left">Leírás</th>
                        <th className="px-4 py-2.5 text-center">Mértékegység</th>
                        <th className="px-4 py-2.5 text-center">Létrehozva</th>
                        <th className="px-4 py-2.5 text-center">Státusz</th>
                        <th className="px-4 py-2.5 text-center">Műveletek</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {products.length > 0 && products.map((product) => (
                        <tr key={product.id} className="hover:bg-slate-800/40 transition-colors duration-150">
                            <td className="px-4 py-2.5 font-mono text-indigo-400 font-medium">{product.sku}</td>
                            <td className="px-4 py-2.5 font-semibold text-white">{product.name}</td>
                            <td className="px-4 py-2.5 text-slate-400 text-xs max-w-xs truncate">{product.description}</td>
                            <td className="px-4 py-2.5 text-center text-slate-300">{product.unit}</td>
                            <td className="px-4 py-2.5 text-center text-slate-400 text-xs">{new Date(product.createdAt).toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-center">
                                {activeTab === "deleted" ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                        Törölt
                                    </span>
                                ) : product.active ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        Aktív
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                        Inaktív
                                    </span>
                                )}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                                <OperationButtons
                                    product={product}
                                    activeTab={activeTab}
                                    loadProducts={loadProducts}
                                    openModal={openModal}
                                    setError={setError}
                                    setIsLoading={setIsLoading}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
