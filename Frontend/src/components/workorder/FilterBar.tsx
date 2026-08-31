import { Plus } from "lucide-react";
import type { WorkOrderFilterBarProps } from "../../types/workorder/workOrderProps";
import type { WorkOrderPriority, WorkOrderStatus } from "../../types/workorder/workOrder";
import { workOrderPriorityOptions, workOrderStatusOptions } from "../../constants/workOrder";
import { FilterSearch } from "../common/filter/FilterSearch";
import { FilterSelect } from "../common/filter/FilterSelect";
import { SubmitButton } from "../common/form/SubmitButton";

export const WorkOrderFilterBar = ({ searchTerm, setSearchTerm, statusFilter, setStatusFilter, priorityFilter, setPriorityFilter, openCreateModal, workOrderUserFilter, setWorkOrderUserFilter, activeWorkers }: WorkOrderFilterBarProps) => {

    return (
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 pt-1 w-full">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                <FilterSearch
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Keresés - rendelésszám, termék, vevő..."
                />

                <FilterSelect
                    label="Státusz"
                    value={statusFilter}
                    onChange={(value) => setStatusFilter(value as WorkOrderStatus | "ALL")}
                    options={workOrderStatusOptions}
                    allOptionsLabel="Mindegyik"
                />

                <FilterSelect
                    label="Prioritás"
                    value={priorityFilter}
                    onChange={(value) => setPriorityFilter(value as WorkOrderPriority | "ALL")}
                    options={workOrderPriorityOptions}
                    allOptionsLabel="Mindegyik"
                />

                <FilterSelect
                    label="Felelős"
                    value={workOrderUserFilter}
                    onChange={(value) => setWorkOrderUserFilter(value)}
                    options={[{ key: "UNASSIGNED", label: "Nincs felelős" }, ...activeWorkers.map(w => ({ key: w.id, label: w.username }))]}
                    allOptionsLabel="Mindegyik"
                />

            </div>

            <SubmitButton
                onClick={openCreateModal}
                text="Új gyártási rendelés"
                icon={<Plus size={18} />}
                className="px-5 py-2.5 rounded-xl cursor-pointer"
            />
        </div>
    )
}