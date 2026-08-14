import { useEffect, useState } from "react"
import { Background } from "../components/common/Background"
import type { InventoryResponse } from "../types/inventory/inventory"
import { getAllInventories } from "../services/inventoryService"
import { Title } from "../components/common/Title"
import { InventoryFilterBar } from "../components/inventory/FilterBar"
import { InventoryTable } from "../components/inventory/Table"
import { AdjustInventory } from "../components/inventory/modal/Adjust"
import { InventoryChartCards } from "../components/inventory/ChartCards"
import { LoadingSpinner } from "../components/common/LoadingSpinner"
import type { InventoryFilterBarProps, InventoryTableProps } from "../types/inventory/inventoryProps"

export const InventoryView = () => {

    const [inventories, setInventories] = useState<InventoryResponse[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [locationFilter, setLocationFilter] = useState<string>("")
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
    const [selectedInventory, setSelectedInventory] = useState<InventoryResponse | null>(null)

    const loadInventories = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await getAllInventories()
            setInventories(response)
        } catch (error) {
            setError(error instanceof Error ? error.message : String(error))
        } finally {
            setIsLoading(false)
        }
    }

    const openModal = (inventoryId?: string) => {
        if (inventoryId) {
            const inventory = inventories.find(inv => inv.id === inventoryId) || null
            setSelectedInventory(inventory)
        } else {
            setSelectedInventory(inventories[0] || null)
        }
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setSelectedInventory(null)
    }

    useEffect(() => {
        loadInventories()
    }, [])

    const filteredInventories = inventories.filter((inv) => {
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
        <div className="relative flex-1 w-full flex flex-col items-center justify-start p-4 sm:p-6 font-sans">
            <Background />

            <AdjustInventory
                isOpen={isModalOpen}
                closeModal={closeModal}
                inventory={selectedInventory}
                onUpdate={loadInventories}
            />

            {isLoading && <LoadingSpinner />}

            {!isLoading && (
                <div className="w-full max-w-7xl backdrop-blur-xl bg-slate-900/60 border border-slate-800 shadow-2xl rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 relative z-10">

                    <Title page="inventory" />

                    <InventoryFilterBar {...filterBarProps} />

                    {error && (
                        <div className="text-left text-rose-400 text-sm font-medium">{error}</div>
                    )}

                    {inventories.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {filteredInventories.slice(0, 3).map((inv) => (
                                <InventoryChartCards key={inv.id} {...inv} />
                            ))}
                        </div>
                    )}

                    {inventories.length === 0 && (
                        <div className="text-left text-slate-400 text-sm font-medium">Nincs raktári tétel</div>
                    )}

                    {inventories.length > 0 && filteredInventories.length === 0 && (
                        <div className="text-left text-slate-400 text-sm font-medium">Nincs a keresésnek megfelelő raktári tétel</div>
                    )}

                    {filteredInventories.length > 0 && <InventoryTable {...tableProps} />}
                </div>
            )}
        </div>
    )
}