import { Pencil, Trash2 } from "lucide-react"
import type { MachineCardProps } from "../../types/machine/MachineProps"
import { MachineStatusBadge, MachineTypeBadge } from "../common/Badges"
import { SelectField } from "../common/form/SelectField"
import { MACHINE_STATUS_OPTIONS } from "../../constants/machineStatus"
import type { MachineStatus } from "../../types/machine/MachineStatus"

export const MachineCard = ({ machine, onEdit, onDelete, onStatusChange, users, onAssignUser }: MachineCardProps) => {
    return (
        <div className="flex flex-col rounded-2xl p-5 shadow-xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl hover:border-slate-700/60 transition-all space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-200">{machine.code} - {machine.name}</h3>
                <div className="flex items-center gap-2">
                    <MachineTypeBadge type={machine.type} />
                    <MachineStatusBadge status={machine.status} />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                <div className="flex items-center gap-2">
                    <p className="text-sm text-slate-400">Gyártó: </p>
                    <p className="text-sm text-slate-400">{machine.manufacturer || "-"}</p>
                </div>
                <div className="flex items-center gap-2">
                    <p className="text-sm text-slate-400">Típus: </p>
                    <p className="text-sm text-slate-400">{machine.model}</p>
                </div>
                <div className="flex items-center gap-2">
                    <p className="text-sm text-slate-400">Szériaszám: </p>
                    <p className="text-sm text-slate-400">{machine.serialNumber || "-"}</p>
                </div>
                <div className="flex items-center gap-2">
                    <p className="text-sm text-slate-400">Telephely: </p>
                    <p className="text-sm text-slate-400">{machine.location || "-"}</p>
                </div>
                <div className="flex items-center gap-2">
                    <p className="text-sm text-slate-400">Gyorsasági: </p>
                    <p className="text-sm text-slate-400">{machine.idealCycleTimeSeconds} mp/db | {machine.targetPcsPerHour} db/óra</p>
                </div>
                <div className="flex items-center gap-2">
                    <p className="text-sm text-slate-400">Munkavezető: </p>
                    <p className="text-sm text-slate-400">{machine.assignedUserName || ""}</p>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-3 pt-3 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onEdit(machine)}
                        title="Gép szerkesztése"
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
                    >
                        <Pencil size={18} />
                    </button>
                    <button
                        onClick={() => onDelete(machine.id)}
                        title="Gép törlése"
                        className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
                <div className="flex-1 max-w-xs">
                    <SelectField
                        label="Munkavezető"
                        value={machine.assignedUserId || ""}
                        onChange={(e) => onAssignUser(machine.id, e.target.value)}
                        placeholderOption="-- Nincs felelős --"
                        options={users.map((user) => ({ key: user.id, label: user.username }))}
                    />
                </div>
                <div className="flex-1 max-w-xs">
                    <SelectField
                        label="Élő Státusz"
                        options={MACHINE_STATUS_OPTIONS}
                        value={machine.status || ""}
                        onChange={(e) => onStatusChange(machine.id, e.target.value as MachineStatus)}
                    />
                </div>
            </div>
        </div>
    )
}