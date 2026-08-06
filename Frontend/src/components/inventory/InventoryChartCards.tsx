import { useEffect, useState } from "react"
import type { InventoryChartProps } from "../../types/inventory/inventoryProps"

export const InventoryChartCards = ({ productName, productSku, quantity, reservedQuantity, location }: InventoryChartProps) => {

    const [isAnimated, setIsAnimated] = useState<boolean>(false)

    const availableStock = Math.max(0, quantity - reservedQuantity)
    const stockPercentage = quantity > 0 ? 100 : 0
    const reservedPercentage = quantity > 0 ? Math.min(100, Math.max(0, (reservedQuantity / quantity) * 100)) : 0

    useEffect(() => {
        setIsAnimated(true)
    }, [])

    return (
        <div className="flex flex-col rounded-2xl p-5 shadow-xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl hover:border-slate-700/60 transition-all space-y-4">

            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div className="flex flex-col">
                    <span className="text-xs font-mono text-indigo-400 font-semibold uppercase tracking-wider">{productSku || "Nincs SKU"}</span>
                    <h3 className="text-base font-bold text-white leading-snug mt-0.5">{productName || "Ismeretlen termék"}</h3>
                </div>
                {location && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {location}
                    </span>
                )}
            </div>

            <div className="flex flex-row justify-around items-end h-40 p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 relative">
                <div className="flex flex-col items-center h-full justify-end w-1/3">
                    <span className="text-xs font-bold text-indigo-300 mb-1">{quantity} db</span>
                    <div
                        title={`Fizikai készlet: ${quantity} db`}
                        className="w-full bg-linear-to-t from-indigo-600 to-indigo-500 rounded-t-lg transition-all duration-1000 ease-out shadow-lg shadow-indigo-500/20"
                        style={{ height: isAnimated ? `${stockPercentage}%` : "0%" }}
                    />
                    <span className="text-[11px] font-medium text-slate-400 mt-1.5 uppercase">Készlet</span>
                </div>

                <div className="flex flex-col items-center h-full justify-end w-1/3">
                    <span className="text-xs font-bold text-amber-300 mb-1">{reservedQuantity} db</span>
                    <div
                        title={`Lefoglalt készlet: ${reservedQuantity} db`}
                        className="w-full bg-linear-to-t from-amber-600 to-amber-500 rounded-t-lg transition-all duration-1000 ease-out shadow-lg shadow-amber-500/20"
                        style={{ height: isAnimated ? `${reservedPercentage}%` : "0%" }}
                    />
                    <span className="text-[11px] font-medium text-slate-400 mt-1.5 uppercase">Lefoglalt</span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center border-t border-slate-800/80">
                <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-slate-400">Fizikai</span>
                    <span className="text-sm font-bold text-white">{quantity}</span>
                </div>
                <div className="flex flex-col border-x border-slate-800/80">
                    <span className="text-[11px] font-medium text-slate-400">Lefoglalt</span>
                    <span className="text-sm font-bold text-amber-400">{reservedQuantity}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-slate-400">Elérhető</span>
                    <span className="text-sm font-bold text-emerald-400">{availableStock}</span>
                </div>
            </div>

        </div>
    )
}