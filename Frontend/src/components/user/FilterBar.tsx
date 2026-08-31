import { UserPlus } from "lucide-react"
import type { UserFilterBarProps } from "../../types/user/UserProps"
import type { UserRole, UserStatus } from "../../types/user/User"
import { ROLE_OPTIONS } from "../../constants/roles"
import { USER_STATUS_OPTIONS } from "../../constants/userStatus"
import { FilterSearch } from "../common/filter/FilterSearch"
import { FilterSelect } from "../common/filter/FilterSelect"
import { SubmitButton } from "../common/form/SubmitButton"

export const FilterBar = ({
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    openCreateModal
}: UserFilterBarProps) => {

    return (
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 pt-1 w-full">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                <FilterSearch
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Keresés név, e-mail vagy telefonszám szerint..."
                />

                <FilterSelect
                    label="Szerepkör"
                    value={roleFilter}
                    onChange={(value) => setRoleFilter(value as UserRole | "ALL")}
                    options={ROLE_OPTIONS}
                    allOptionsLabel="Mindegyik"
                />

                <FilterSelect
                    label="Státusz"
                    value={statusFilter}
                    onChange={(value) => setStatusFilter(value as UserStatus | "ALL")}
                    options={USER_STATUS_OPTIONS}
                    allOptionsLabel="Mindegyik"
                />
            </div>

            <SubmitButton
                onClick={openCreateModal}
                text="Új felhasználó"
                icon={<UserPlus size={18} />}
                className="px-5 py-2.5 rounded-xl cursor-pointer"
            />

        </div>
    )
}