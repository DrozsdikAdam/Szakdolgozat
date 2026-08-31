import { Background } from "../components/common/Background"
import { LoadingSpinner } from "../components/common/LoadingSpinner"
import { FilterBar } from "../components/user/FilterBar"
import { Title } from "../components/common/Title"
import { CreateUser } from "../components/user/modal/Create"
import { EditUser } from "../components/user/modal/Edit"
import { UserStatsCards } from "../components/user/StatsCard"
import { useEffect, useState } from "react"
import type { UserResponse, UserRole } from "../types/user/User"
import { getUsers, toggleUserStatus } from "../services/userService"
import { Card } from "../components/user/Card"
import type { UserFilterBarProps } from "../types/user/UserProps"
import { PromoteUser } from "../components/user/modal/Promote"
import type { PagedResponse } from "../types/common/PagedResponse"
import { Pagination } from "../components/common/Pagination"

export const UserView = () => {

    const [pagedUsers, setPagedUsers] = useState<PagedResponse<UserResponse>>({
        content: [],
        pageNumber: 0,
        pageSize: 10,
        totalPages: 0,
        totalElements: 0,
        first: true,
        last: true
    })
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL")
    const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "INACTIVE" | "ALL">("ALL")
    const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false)
    const [selectedEditUser, setSelectedEditUser] = useState<UserResponse | null>(null)
    const [selectedPromoteUser, setSelectedPromoteUser] = useState<UserResponse | null>(null)

    const loadUsers = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await getUsers(pagedUsers.pageNumber, pagedUsers.pageSize)
            setPagedUsers(response)
        } catch (error) {
            setError(error instanceof Error ? error.message : "Hiba a betöltés közben!")
        } finally {
            setIsLoading(false)
        }
    }

    const filteredUsers = pagedUsers.content.filter(user => {
        const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.phoneNumber ? user.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase()) : false)

        const matchesRole = roleFilter === "ALL" || user.roles.includes(roleFilter)
        const matchesStatus = statusFilter === "ALL" || user.active === (statusFilter === "ACTIVE")

        return matchesSearch && matchesRole && matchesStatus
    })

    useEffect(() => {
        loadUsers()
    }, [pagedUsers.pageNumber, pagedUsers.pageSize])

    useEffect(() => {
        setPagedUsers(prev => ({ ...prev, pageNumber: 0 }))
    }, [searchTerm, roleFilter, statusFilter])

    const handleEdit = (user: UserResponse) => {
        setSelectedEditUser(user)
    }

    const handlePromote = (user: UserResponse) => {
        setSelectedPromoteUser(user)
    }

    const handleToggleStatus = async (user: UserResponse) => {
        try {
            await toggleUserStatus(user.id)
            loadUsers()
        } catch (error) {
            setError(error instanceof Error ? error.message : "Hiba a mentés közben!")
        }
    }

    const FilterBarProps: UserFilterBarProps = {
        searchTerm,
        setSearchTerm,
        roleFilter,
        setRoleFilter,
        statusFilter,
        setStatusFilter,
        openCreateModal: () => setIsCreateOpen(true)
    }

    return (
        <div className="relative flex-1 w-full flex flex-col items-center justify-start p-4 sm:p-6 font-sans">

            <Background />

            <CreateUser isOpen={isCreateOpen} closeModal={() => setIsCreateOpen(false)} onSuccess={loadUsers} />
            <EditUser isOpen={selectedEditUser !== null} closeModal={() => setSelectedEditUser(null)} user={selectedEditUser} onSuccess={loadUsers} />
            <PromoteUser isOpen={selectedPromoteUser !== null} closeModal={() => setSelectedPromoteUser(null)} user={selectedPromoteUser} onSuccess={loadUsers} />

            {isLoading && <LoadingSpinner />}

            {!isLoading &&
                <div className="w-full max-w-7xl backdrop-blur-xl bg-slate-900/60 border border-slate-800 shadow-2xl rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 relative z-10">

                    <Title page="user" />

                    <UserStatsCards users={pagedUsers.content} />

                    <FilterBar {...FilterBarProps} />

                    {error &&
                        <div className="text-left text-red-400 text-sm font-medium">{error}</div>
                    }

                    {pagedUsers.totalElements === 0 &&
                        <div className="text-left text-slate-400 text-sm font-medium">Nincs felhasználó</div>
                    }

                    {pagedUsers.totalElements > 0 && filteredUsers.length === 0 && (
                        <div className="text-left text-slate-400 text-sm font-medium">Nincs a keresésnek megfelelő felhasználó</div>
                    )}

                    {filteredUsers.length > 0 && (
                        <Pagination
                            pageNumber={pagedUsers.pageNumber}
                            pageSize={pagedUsers.pageSize}
                            totalElements={pagedUsers.totalElements}
                            totalPages={pagedUsers.totalPages}
                            first={pagedUsers.first}
                            last={pagedUsers.last}
                            onPageChange={(newPageNumber) => {
                                setPagedUsers(prev => ({ ...prev, pageNumber: newPageNumber }))
                            }}
                            onPageSizeChange={(newPageSize) => {
                                setPagedUsers(prev => ({ ...prev, pageSize: newPageSize, pageNumber: 0 }))
                            }}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 w-full">
                                {filteredUsers.map(user =>
                                    <Card
                                        key={user.id}
                                        user={user}
                                        onEdit={handleEdit}
                                        onPromote={handlePromote}
                                        onToggleStatus={handleToggleStatus} />)
                                }
                            </div>
                        </Pagination>
                    )}
                </div>
            }
        </div>
    )
}