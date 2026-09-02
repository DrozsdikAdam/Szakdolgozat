import type { InventoryFilterBarProps } from "../../types/inventory/inventoryProps"
import { MapPin, Plus } from "lucide-react"
import { FilterSearch } from "../common/filter/FilterSearch"
import { SubmitButton } from "../common/form/SubmitButton"
import { Can } from "../common/Can"

export const InventoryFilterBar = ({ searchTerm, setSearchTerm, locationFilter, setLocationFilter, openModal }: InventoryFilterBarProps) => {
    return (
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 pt-1">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                <FilterSearch
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Cikkszám, név keresése..."
                />

                <FilterSearch
                    value={locationFilter}
                    onChange={setLocationFilter}
                    placeholder="Raktárhely szűrés..."
                    icon={<MapPin size={18} />}
                />
            </div>
            <Can roles={["SYSTEMADMIN", "MANAGER", "TECHNICIAN"]}>
                <SubmitButton
                    text="Készlet módosítása"
                    icon={<Plus size={18} />}
                    onClick={() => openModal()}
                    className="px-5 py-2.5 rounded-xl cursor-pointer"
                />
            </Can>
        </div>
    )
}