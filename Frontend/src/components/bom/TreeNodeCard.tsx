import { Layers, Package } from "lucide-react"
import type { TreeNodeCardProps } from "../../types/bom/bomProps"

export const TreeNodeCard = ({ node, level }: TreeNodeCardProps) => {
    const isRoot = level === 0

    return (
        <div className="flex flex-col items-center">
            <div
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border backdrop-blur-xl shadow-xl transition-all w-48 text-center space-y-1 ${isRoot
                    ? "bg-(--cud-skyblue-bg) border-(--cud-skyblue-border) text-white ring-2 ring-(--cud-skyblue-border)"
                    : "bg-slate-900/80 border-slate-700/80 text-slate-100 hover:border-slate-600"
                    }`}
            >
                <div className="flex items-center gap-1.5 justify-center">
                    {isRoot ? <Package size={16} className="text-cud-skyblue" /> : <Layers size={14} className="text-cud-orange" />}
                    <span className="text-xs font-mono text-cud-skyblue font-semibold uppercase">{node.productSku || "Nincs SKU"}</span>
                </div>
                <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug">{node.productName}</h4>
                <div className="pt-1 border-t border-slate-800/80 w-full mt-1">
                    <span className="text-xs font-semibold text-cud-teal">
                        {node.quantity} {node.unit}
                    </span>
                </div>
            </div>

            {node.children && node.children.length > 0 && (
                <div className="flex flex-col items-center w-full">
                    {/* Vertical Connecting Line Down */}
                    <div className="w-0.5 h-6 bg-slate-700/80" />
                    <div className="flex flex-wrap items-start justify-center gap-6 relative pt-2 border-t border-slate-700/80 rounded-t-xl px-4">
                        {node.children.map((child) => (
                            <TreeNodeCard key={child.productId} node={child} level={level + 1} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}