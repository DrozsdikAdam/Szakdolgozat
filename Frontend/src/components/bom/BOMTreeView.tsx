import type { BOMTreeViewProps } from "../../types/bomProps"
import { Package } from "lucide-react"
import { TreeNodeCard } from "./TreeNodeCard"

export const BOMTreeView = ({ treeNodes }: BOMTreeViewProps) => {
    if (!treeNodes) {
        return (
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-slate-800 bg-slate-900/40 text-center space-y-3">
                <Package size={40} className="text-slate-600" />
                <p className="text-slate-400 text-sm font-medium">
                    Válasszon egy főterméket a fenti sávban a gyártási fa megjelenítéséhez!
                </p>
            </div>
        )
    }

    if (treeNodes.children.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-6">
                <TreeNodeCard node={treeNodes} level={0} />
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 text-slate-400 text-sm font-medium text-center max-w-md">
                    Ehhez a termékhez még nem lett alkatrész hozzárendelve. Kattintson az *"Összetevő hozzáadása"* gombra az első alkatrész felvételéhez!
                </div>
            </div>
        )
    }

    return (
        <div className="w-full overflow-x-auto p-6 flex items-center justify-center">
            <TreeNodeCard node={treeNodes} level={0} />
        </div>
    )
}