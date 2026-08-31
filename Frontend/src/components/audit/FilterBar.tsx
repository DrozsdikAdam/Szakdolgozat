import type { AuditAction, AuditEntityType } from "../../types/audit/AuditLog";
import type { AuditFilterBarProps } from "../../types/audit/AuditLogProps";
import { AUDIT_ACTION_OPTIONS } from "../../constants/AuditAction";
import { AUDIT_ENTITY_TYPE_OPTIONS } from "../../constants/AuditEntityType";
import { FilterSearch } from "../common/filter/FilterSearch";
import { FilterSelect } from "../common/filter/FilterSelect";

export const FilterBar = ({ searchTerm, setSearchTerm, selectedEntity, setSelectedEntity, selectedAction, setSelectedAction }: AuditFilterBarProps) => {
    return (
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 pt-1 w-full">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">

                <FilterSearch
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Keresés - cím, gépkód, technikus..."
                />

                <FilterSelect
                    label="Művelet"
                    value={selectedAction}
                    onChange={(value) => setSelectedAction(value as AuditAction | "ALL")}
                    options={AUDIT_ACTION_OPTIONS}
                    allOptionsLabel="Mindegyik"
                />

                <FilterSelect
                    label="Entitás"
                    value={selectedEntity}
                    onChange={(value) => setSelectedEntity(value as AuditEntityType | "ALL")}
                    options={AUDIT_ENTITY_TYPE_OPTIONS}
                    allOptionsLabel="Mindegyik"
                />

            </div>
        </div>
    )
}