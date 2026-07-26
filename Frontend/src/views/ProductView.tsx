import { useEffect, useState } from "react"
import type { ProductResponse } from "../types/Product"
import {
    getActiveProducts,
    getDeletedProducts,
    getInactiveProducts,
} from "../services/productService"
import { Background } from "../components/Background"
import { CreateModal } from "../components/product/modals/Create"
import { EditModal } from "../components/product/modals/Edit"
import { LoadingSpinner } from "../components/LoadingSpinner"

import { Title } from "../components/product/Title"
import { Stats } from "../components/product/Stats"
import { FilterBar } from "../components/product/FilterBar"
import type { FilterBarProps, TableProps } from "../types/ProductButtonProps"
import { Table } from "../components/product/Table"

export const ProductView = () => {

    const [products, setProducts] = useState<ProductResponse[]>([])
    const [activeTab, setActiveTab] = useState<'active' | 'inactive' | 'deleted'>('active')
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
    const [modalType, setModalType] = useState<'create' | 'edit' | null>(null)
    const [editingProduct, setEditingProduct] = useState<ProductResponse | null>(null)

    const openModal = (product: ProductResponse | null) => {
        if (product) {
            setEditingProduct(product)
            setModalType('edit')
        } else {
            setEditingProduct(null)
            setModalType('create')
        }
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setModalType(null)
        setEditingProduct(null)
    }

    const loadProducts = async () => {

        setIsLoading(true)
        setError(null)

        let response: ProductResponse[] = []
        try {
            if (activeTab == "active") response = await getActiveProducts();
            else if (activeTab == "inactive") response = await getInactiveProducts();
            else response = await getDeletedProducts();
        } catch (error) {
            setError(error instanceof Error ? error.message : String(error))
        } finally {
            setProducts(response)
            setIsLoading(false)
        }
    }

    const FilterBarProps: FilterBarProps = {
        activeTab,
        searchTerm,
        setSearchTerm,
        setActiveTab,
        openModal
    }

    const TableProps: TableProps = {
        products,
        activeTab,
        loadProducts,
        openModal,
        setError,
        setIsLoading
    }

    useEffect(() => {
        loadProducts()
    }, [activeTab])


    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-start bg-[#0f172a] text-slate-100 p-4 sm:p-6 font-sans">

            <Background />

            <CreateModal isOpen={isModalOpen && modalType === 'create'} onClose={closeModal} onSuccess={loadProducts} />
            <EditModal product={editingProduct} isOpen={isModalOpen && modalType === 'edit'} onClose={closeModal} onSuccess={loadProducts} />

            {isLoading && <LoadingSpinner />}

            {!isLoading &&
                <div className="w-full max-w-7xl backdrop-blur-xl bg-slate-900/60 border border-slate-800 shadow-2xl rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 relative z-10">

                    <Title />

                    <Stats />

                    <FilterBar {...FilterBarProps} />

                    {error &&
                        <div className="text-left text-red-400 text-sm font-medium">{error}</div>
                    }

                    {products.length === 0 &&
                        <div className="text-left text-slate-400 text-sm font-medium">Nincs termék</div>
                    }

                    {products.length > 0 && <Table {...TableProps} />}
                </div>
            }
        </div>
    )
}