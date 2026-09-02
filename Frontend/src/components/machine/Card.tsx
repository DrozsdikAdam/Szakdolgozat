import { Pencil, PowerOff, Trash2 } from "lucide-react"
import type { MachineCardProps } from "../../types/machine/MachineProps"
import { MachineStatusBadge, MachineTypeBadge } from "../common/Badges"
import { SelectField } from "../common/form/SelectField"
import { MACHINE_STATUS_OPTIONS } from "../../constants/machineStatus"
import type { MachineStatus } from "../../types/machine/MachineStatus"
import { Can } from "../common/Can"

export const MachineCard = ({ machine, onEdit, onDelete, workOrders, onStartWorkOrder, onStatusChange, users, onAssignUser, onEmergencyStop }: MachineCardProps) => {

    const activeOrder = machine.assignedUserId ? workOrders.find(wo => wo.assignedUserId === machine.assignedUserId && wo.status === "IN_PROGRESS") : null;

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
            <div>
                {activeOrder ?
                    <div className="flex flex-col gap-1 p-3 bg-slate-800/60 backdrop-blur-xl rounded-lg mt-2 border-l-4 border-blue-500">
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-bold text-slate-200">
                                {activeOrder.orderNumber}
                            </p>
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded border border-blue-500/20">
                                Folyamatban
                            </span>
                        </div>

                        <div className="text-sm text-slate-400">
                            Termék: <span className="text-slate-200">{activeOrder.productName}</span>
                        </div>
                        <div className="text-sm text-slate-400">
                            Elindítva: <span className="text-slate-200">
                                {activeOrder.startDate ? new Date(activeOrder.startDate)
                                    .toLocaleString('hu-HU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "-"
                                }
                            </span>
                        </div>
                        <div className="text-sm text-slate-400">
                            Kész darab: <span className="text-slate-200">{activeOrder.goodQuantity} / {activeOrder.targetQuantity} db</span>
                        </div>
                        <div className="text-sm text-slate-400">
                            Selejt: <span className="text-slate-200">{activeOrder.scrapQuantity} db</span>
                        </div>
                        <div className="space-y-1 mt-1">
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>Gyártási haladás</span>
                                <span className="text-indigo-300 font-bold">{activeOrder.progressPercentage?.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-slate-950/80 rounded-full h-2 border border-slate-700/60 overflow-hidden p-0.5">
                                <div
                                    className="bg-linear-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-sm shadow-indigo-500/50"
                                    style={{ width: `${activeOrder.progressPercentage}%` }}
                                ></div>
                            </div>
                        </div>

                    </div>
                    :
                    <div className="flex flex-col gap-2">
                        <p className="text-sm text-slate-400">Nincs aktív gyártási feladat</p>
                        <div className="flex items-center gap-2 mt-2">
                            <SelectField
                                label="Új rendelés indítása a gépen"
                                placeholderOption="-- Válasszon rendelést az indításhoz --"
                                options={workOrders
                                    .filter(wo => wo.status === "PLANNED" || wo.status === "PREPARED")
                                    .map(wo => ({
                                        key: wo.id,
                                        label: `${wo.orderNumber} - ${wo.productName} (${wo.targetQuantity} db)`
                                    }))}
                                onChange={(e) => {
                                    if (e.target.value) onStartWorkOrder(machine.id, e.target.value, machine.assignedUserId);
                                }}
                            />

                        </div>
                    </div>
                }
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-3 pt-3 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                    <Can roles={["SYSTEMADMIN", "MANAGER"]}>
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
                    </Can>
                    <button
                        onClick={() => onEmergencyStop(machine.id)}
                        title="Leállt a gép"
                        className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all"
                    >
                        <PowerOff size={18} />
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