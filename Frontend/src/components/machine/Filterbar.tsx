import type { MachineFilterBarProps } from "../../types/machine/MachineProps"
import { MACHINE_STATUS_OPTIONS } from "../../constants/machineStatus"
import { MACHINE_TYPE_OPTIONS } from "../../constants/machineType"
import { Plus } from "lucide-react"
import type { MachineStatus, MachineType } from "../../types/machine/MachineStatus"
import { FilterSearch } from "../common/filter/FilterSearch"
import { FilterSelect } from "../common/filter/FilterSelect"
import { SubmitButton } from "../common/form/SubmitButton"

export const MachineFilterBar = ({ searchTerm, setSearchTerm, statusFilter, setStatusFilter, typeFilter, setTypeFilter, onCreate }: MachineFilterBarProps) => {
    return (
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 pt-1 w-full">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                <FilterSearch
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Keresés - gépnév, kód, gyári szám, helyszín..."
                />

                <FilterSelect
                    label="Státusz"
                    value={statusFilter}
                    onChange={(value) => setStatusFilter(value as MachineStatus | "ALL")}
                    options={MACHINE_STATUS_OPTIONS}
                    allOptionsLabel="Mindegyik"
                />

                <FilterSelect
                    label="Gép típusa"
                    value={typeFilter}
                    onChange={(value) => setTypeFilter(value as MachineType | "ALL")}
                    options={MACHINE_TYPE_OPTIONS}
                    allOptionsLabel="Mindegyik"
                />
            </div>

            <SubmitButton
                onClick={onCreate}
                text="Új gép"
                icon={<Plus size={18} />}
                className="px-5 py-2.5 rounded-xl cursor-pointer"
            />
        </div>
    )
}