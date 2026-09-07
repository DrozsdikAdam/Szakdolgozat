import { Pencil, Power, RotateCcw, Trash2 } from "lucide-react"
import type { ActivateProps, DeactivateProps, DeleteProps, EditProps, RestoreProps } from "../../types/product/ProductProps"

export const ActivateButton = ({ id, handleActivateProduct }: ActivateProps) => {

    return (
        <button
            onClick={() => handleActivateProduct(id)}
            title="Visszaállítás"
            className="p-2 rounded-lg bg-(--cud-teal-bg) text-cud-teal hover:bg-(--cud-teal)/20 border border-(--cud-teal-border) transition-all duration-200 outline-none focus:ring-2 focus:ring-(--cud-teal)/40"
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
            className="p-2 rounded-lg bg-(--cud-orange-bg) text-cud-orange hover:bg-(--cud-orange)/20 border border-(--cud-orange-border) transition-all duration-200 outline-none focus:ring-2 focus:ring-(--cud-orange)/40"
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
            className="p-2 rounded-lg bg-(--cud-skyblue-bg) text-cud-skyblue hover:bg-(--cud-skyblue)/20 border border-(--cud-skyblue-border) transition-all duration-200 outline-none focus:ring-2 focus:ring-(--cud-skyblue)/40"
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
            className="p-2 rounded-lg bg-(--cud-teal-bg) text-cud-teal hover:bg-(--cud-teal)/20 border border-(--cud-teal-border) transition-all duration-200 outline-none focus:ring-2 focus:ring-(--cud-teal)/40"
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
            className="p-2 rounded-lg bg-(--cud-vermillon-bg) text-cud-vermillon hover:bg-(--cud-vermillon)/20 border border-(--cud-vermillon-border) transition-all duration-200 outline-none focus:ring-2 focus:ring-(--cud-vermillon)/40"
        >
            <Trash2 size={16} />
        </button>
    )

}