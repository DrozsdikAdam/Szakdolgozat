import { useEffect, useState } from "react"
import { Background } from "../components/common/Background"
import type { InventoryResponse } from "../types/inventory/inventory"
import { getInventories } from "../services/inventoryService"
import { Title } from "../components/common/Title"
import { InventoryFilterBar } from "../components/inventory/FilterBar"
import { InventoryTable } from "../components/inventory/Table"
import { AdjustInventory } from "../components/inventory/modal/Adjust"
import { InventoryChartCards } from "../components/inventory/ChartCards"
import { LoadingSpinner } from "../components/common/LoadingSpinner"
import type { InventoryFilterBarProps, InventoryTableProps } from "../types/inventory/inventoryProps"
import type { PagedResponse } from "../types/common/PagedResponse"
import { Pagination } from "../components/common/Pagination"

export const InventoryView = () => {

    const [pagedInventories, setPagedInventories] = useState<PagedResponse<InventoryResponse>>({
        content: [],
        pageNumber: 0,
        pageSize: 10,
        totalPages: 0,
        totalElements: 0,
        first: true,
        last: true
    })
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [locationFilter, setLocationFilter] = useState<string>("")
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
    const [selectedInventory, setSelectedInventory] = useState<InventoryResponse | null>(null)

    const loadInventories = async (showSpinner: boolean = true) => {
        if (showSpinner) setIsLoading(true)
        setError(null)
        try {
            const response = await getInventories(pagedInventories.pageNumber, pagedInventories.pageSize)
            setPagedInventories(response)
        } catch (error) {
            setError(error instanceof Error ? error.message : String(error))
        } finally {
            setIsLoading(false)
        }
    }

    const openModal = (inventoryId?: string) => {
        if (inventoryId && typeof inventoryId === "string") {
            const inventory = pagedInventories.content.find(inv => inv.id === inventoryId) || null
            setSelectedInventory(inventory)
        } else setSelectedInventory(null)

        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setSelectedInventory(null)
    }

    useEffect(() => {
        loadInventories(true)
        const interval = setInterval(() => loadInventories(false), 5000)
        return () => clearInterval(interval)
    }, [pagedInventories.pageNumber, pagedInventories.pageSize])

    useEffect(() => {
        setPagedInventories(prev => ({ ...prev, pageNumber: 0 }))
    }, [searchTerm, locationFilter])

    const filteredInventories = pagedInventories.content.filter((inv) => {
        const productName = inv.productName || ""
        const productSku = inv.productSku || ""
        const location = inv.location || ""

        const matchesSearch = productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            productSku.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesLocation = !locationFilter ||
            location.toLowerCase().includes(locationFilter.toLowerCase())

        return matchesSearch && matchesLocation
    })

    const filterBarProps: InventoryFilterBarProps = {
        searchTerm,
        setSearchTerm,
        locationFilter,
        setLocationFilter,
        openModal
    }

    const tableProps: InventoryTableProps = {
        data: filteredInventories,
        openModal
    }

    return (
        <div className="page-container">
            <Background />

            <AdjustInventory
                inventories={pagedInventories.content}
                isOpen={isModalOpen}
                closeModal={closeModal}
                inventory={selectedInventory}
                onUpdate={loadInventories}
            />

            {isLoading && <LoadingSpinner />}

            {!isLoading && (
                <div className="page-card space-y-4 sm:space-y-5">

                    <Title page="inventory" />

                    <InventoryFilterBar {...filterBarProps} />

                    {error && (
                        <div className="text-left text-rose-400 text-sm font-medium">{error}</div>
                    )}

                    {pagedInventories.totalElements > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {filteredInventories.slice(0, 3).map((inv) => (
                                <InventoryChartCards key={inv.id} {...inv} />
                            ))}
                        </div>
                    )}

                    {pagedInventories.totalElements === 0 && (
                        <div className="text-left text-slate-400 text-sm font-medium">Nincs raktári tétel</div>
                    )}

                    {pagedInventories.totalElements > 0 && filteredInventories.length === 0 && (
                        <div className="text-left text-slate-400 text-sm font-medium">Nincs a keresésnek megfelelő raktári tétel</div>
                    )}

                    {filteredInventories.length > 0 && (
                        <Pagination
                            pageNumber={pagedInventories.pageNumber}
                            pageSize={pagedInventories.pageSize}
                            totalElements={pagedInventories.totalElements}
                            totalPages={pagedInventories.totalPages}
                            first={pagedInventories.first}
                            last={pagedInventories.last}
                            onPageChange={(newPageNumber) => {
                                setPagedInventories(prev => ({ ...prev, pageNumber: newPageNumber }))
                            }}
                            onPageSizeChange={(newPageSize) => {
                                setPagedInventories(prev => ({ ...prev, pageSize: newPageSize, pageNumber: 0 }))
                            }}
                        >
                            <InventoryTable {...tableProps} />
                        </Pagination>
                    )}
                </div>
            )}
        </div>
    )
}