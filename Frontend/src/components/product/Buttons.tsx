import { Pencil, Power, RotateCcw, Trash2 } from "lucide-react"
import type { ActivateProps, DeactivateProps, DeleteProps, EditProps, RestoreProps } from "../../types/product/ProductProps"

export const ActivateButton = ({ id, handleActivateProduct }: ActivateProps) => {

    return (
        <button
            onClick={() => handleActivateProduct(id)}
            title="Visszaállítás"
            className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 border border-emerald-500/20 transition-all duration-200 outline-none focus:ring-2 focus:ring-emerald-500/40"
        >
            <RotateCcw size={16} />
        </button>
    )

}

export const DeactivateButton = ({ id, handleDeactivateProduct }: DeactivateProps) => {
    return (
        <button
            onClick={() => handleDeactivateProduct(id)}
            title="Deaktiválás"
            className="p-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 border border-amber-500/20 transition-all duration-200 outline-none focus:ring-2 focus:ring-amber-500/40"
        >
            <Power size={16} />
        </button>
    )
}

export const EditButton = ({ product, openModal }: EditProps) => {
    return (
        <button
            onClick={() => openModal(product)}
            title="Szerkesztés"
            className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 border border-indigo-500/20 transition-all duration-200 outline-none focus:ring-2 focus:ring-indigo-500/40"
        >
            <Pencil size={16} />
        </button>
    )
}

export const RestoreButton = ({ id, handleRestoreProduct }: RestoreProps) => {
    return (
        <button
            onClick={() => handleRestoreProduct(id)}
            title="Visszaállítás"
            className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 border border-emerald-500/20 transition-all duration-200 outline-none focus:ring-2 focus:ring-emerald-500/40"
        >
            <RotateCcw size={16} />
        </button>
    )
}

export const DeleteButton = ({ id, handleDeleteProduct }: DeleteProps) => {

    return (
        <button
            onClick={() => handleDeleteProduct(id)}
            title="Törlés"
            className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 border border-rose-500/20 transition-all duration-200 outline-none focus:ring-2 focus:ring-rose-500/40"
        >
            <Trash2 size={16} />
        </button>
    )

}