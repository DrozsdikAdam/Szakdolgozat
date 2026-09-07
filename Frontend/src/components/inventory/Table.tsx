import { Pencil } from "lucide-react"
import type { InventoryTableProps } from "../../types/inventory/inventoryProps"

export const InventoryTable = ({ data, openModal }: InventoryTableProps) => {

    const handleStatus = (quantity: number, reservedQuantity: number) => {
        if ((quantity - reservedQuantity) <= 0) {
            return (
                <span className="badge-danger">
                    Készlethiány
                </span>
            )
        } else if (quantity - reservedQuantity <= 10) {
            return (
                <span className="badge-warning">
                    Alacsony készlet
                </span>
            )
        } else {
            return (
                <span className="badge-success">
                    Készleten
                </span>
            )
        }
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40 shadow-inner">
            {data.length === 0 && (
                <div className="flex items-center justify-center w-full p-4">
                    Nincs készlet adat
                </div>
            )}

            {data.length > 0 && (
                <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-slate-800/80 border-b border-slate-700/60 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                        <tr>
                            <th className="px-4 py-2.5 text-left">Cikkszám</th>
                            <th className="px-4 py-2.5 text-left">Terméknév</th>
                            <th className="px-4 py-2.5 text-left">Raktárhely</th>
                            <th className="px-4 py-2.5 text-center">Fizikai készlet</th>
                            <th className="px-4 py-2.5 text-center">Lefoglalt készlet</th>
                            <th className="px-4 py-2.5 text-center">Elérhető készlet</th>
                            <th className="px-4 py-2.5 text-center">Státusz</th>
                            <th className="px-4 py-2.5 text-center">Műveletek</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                        {data.map((inventory) => (
                            <tr className="hover:bg-slate-800/40 transition-colors duration-150" key={inventory.id}>
                                <td className="px-4 py-2.5 font-mono text-cud-skyblue font-medium">{inventory.productSku}</td>
                                <td className="px-4 py-2.5 font-semibold text-white">{inventory.productName}</td>
                                <td className="px-4 py-2.5 font-semibold text-white">{inventory.location ?? "Nincs megadva"}</td>
                                <td className="px-4 py-2.5 font-semibold text-white text-center">{inventory.quantity}</td>
                                <td className="px-4 py-2.5 text-cud-orange font-medium text-center">{inventory.reservedQuantity}</td>
                                <td className="px-4 py-2.5 text-cud-teal font-semibold text-center">{inventory.quantity - inventory.reservedQuantity}</td>
                                <td className="px-4 py-2.5 text-center">{handleStatus(inventory.quantity, inventory.reservedQuantity)}</td>
                                <td className="px-4 py-2.5 text-center">
                                    <button
                                        onClick={() => openModal(inventory.id)}
                                        title="Készlet módosítása"
                                        className="p-2 rounded-lg bg-(--cud-skyblue-bg) text-cud-skyblue hover:bg-(--cud-skyblue)/20 hover:text-white border border-(--cud-skyblue-border) transition-all duration-200 outline-none focus:ring-2 focus:ring-(--cud-skyblue-border) cursor-pointer"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                </td>
                            </tr >
                        ))}
                    </tbody >
                </table >
            )
            }
        </div >
    )
}