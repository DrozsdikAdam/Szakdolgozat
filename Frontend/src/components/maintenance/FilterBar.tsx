import { Plus } from "lucide-react";
import type { MaintenanceFilterBarProps } from "../../types/maintenance/MaintenanceProps";
import type { MaintenanceStatus, MaintenanceType } from "../../types/maintenance/MaintenanceStatus";
import { STATUS_OPTIONS } from "../../constants/maintenanceStatus";
import { TYPE_OPTIONS } from "../../constants/maintenanceType";
import { FilterSearch } from "../common/filter/FilterSearch";
import { FilterSelect } from "../common/filter/FilterSelect";
import { SubmitButton } from "../common/form/SubmitButton";

export const FilterBar = ({ searchTerm, setSearchTerm, statusFilter, setStatusFilter, typeFilter, setTypeFilter, onCreate }: MaintenanceFilterBarProps) => {

    return (
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 pt-1 w-full">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">

                <FilterSearch
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Keresés - cím, gépkód, technikus..."
                />

                <FilterSelect
                    value={statusFilter}
                    onChange={(value) => setStatusFilter(value as MaintenanceStatus | "ALL")}
                    label="Státusz"
                    options={STATUS_OPTIONS}
                    allOptionsLabel="Mindegyik"
                />

                <FilterSelect
                    value={typeFilter}
                    onChange={(value) => setTypeFilter(value as MaintenanceType | "ALL")}
                    label="Típus"
                    options={TYPE_OPTIONS}
                    allOptionsLabel="Mindegyik"
                />

            </div>

            <SubmitButton
                onClick={onCreate}
                icon={<Plus size={18} />}
                text="Új karbantartás"
                className="px-5 py-2.5 rounded-xl cursor-pointer"
            />
        </div>
    )
}