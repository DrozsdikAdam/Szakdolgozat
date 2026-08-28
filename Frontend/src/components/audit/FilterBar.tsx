import { Search } from "lucide-react";
import type { AuditAction, AuditEntityType } from "../../types/audit/AuditLog";
import type { AuditFilterBarProps } from "../../types/audit/AuditLogProps";
import { SelectField } from "../common/form/SelectField";
import { AUDIT_ACTION_OPTIONS } from "../../constants/AuditAction";
import { AUDIT_ENTITY_TYPE_OPTIONS } from "../../constants/AuditEntityType";

export const FilterBar = ({
    searchTerm,
    setSearchTerm,
    selectedEntity,
    setSelectedEntity,
    selectedAction,
    setSelectedAction
}: AuditFilterBarProps) => {
    return (
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 pt-1 w-full">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                <div className="relative w-full sm:w-64 lg:w-72">
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        type="text"
                        placeholder="Keresés - cím, gépkód, technikus..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <SelectField
                        label="Művelet"
                        value={selectedAction}
                        onChange={(e) => setSelectedAction(e.target.value as AuditAction | "ALL")}
                        options={[
                            { key: "ALL", label: "Mindegyik" },
                            ...AUDIT_ACTION_OPTIONS
                        ]}
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <SelectField
                        label="Entitás"
                        value={selectedEntity}
                        onChange={(e) => setSelectedEntity(e.target.value as AuditEntityType | "ALL")}
                        options={[
                            { key: "ALL", label: "Mindegyik" },
                            ...AUDIT_ENTITY_TYPE_OPTIONS
                        ]}
                    />
                </div>
            </div>
        </div>
    )
}