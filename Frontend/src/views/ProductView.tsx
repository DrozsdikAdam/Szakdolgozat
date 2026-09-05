import { useEffect, useState } from "react"
import type { ProductResponse } from "../types/product/Product"
import {
    getActiveProducts,
    getDeletedProducts,
    getInactiveProducts,
    getProducts,
} from "../services/productService"
import { Background } from "../components/common/Background"
import { CreateModal } from "../components/product/modal/Create"
import { EditModal } from "../components/product/modal/Edit"
import { LoadingSpinner } from "../components/common/LoadingSpinner"

import { Title } from "../components/common/Title"
import { Stats } from "../components/product/Stats"
import { FilterBar } from "../components/product/FilterBar"
import type { FilterBarProps, StatsProps, TableProps } from "../types/product/ProductProps"
import { Table } from "../components/product/Table"
import type { PagedResponse } from "../types/common/PagedResponse"
import { Pagination } from "../components/common/Pagination"

export const ProductView = () => {

    const [pagedProducts, setPagedProducts] = useState<PagedResponse<ProductResponse>>({
        content: [],
        pageNumber: 0,
        pageSize: 10,
        totalPages: 0,
        totalElements: 0,
        first: true,
        last: true
    })
    const [activeTab, setActiveTab] = useState<'active' | 'inactive' | 'deleted'>('active')
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
    const [modalType, setModalType] = useState<'create' | 'edit' | null>(null)
    const [editingProduct, setEditingProduct] = useState<ProductResponse | null>(null)

    const [stats, setStats] = useState<StatsProps>({
        active: 0,
        inactive: 0,
        deleted: 0
    })

    const loadStats = async () => {
        try {
            const [active, inactive, deleted] = await Promise.all([
                getActiveProducts(),
                getInactiveProducts(),
                getDeletedProducts()
            ])
            setStats({
                active: active.length,
                inactive: inactive.length,
                deleted: deleted.length
            })
        } catch (error) {
            setError(error instanceof Error ? error.message : String(error))
        }
    }

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

        try {
            if (activeTab === "active") {
                const response = await getProducts(pagedProducts.pageNumber, pagedProducts.pageSize)
                setPagedProducts(response)
            } else if (activeTab === "inactive") {
                const response = await getInactiveProducts()
                setPagedProducts(prev => ({
                    content: response,
                    pageNumber: 0,
                    pageSize: prev.pageSize || 10,
                    totalElements: response.length,
                    totalPages: 1,
                    first: true,
                    last: true
                }))
            } else {
                const response = await getDeletedProducts()
                setPagedProducts(prev => ({
                    content: response,
                    pageNumber: 0,
                    pageSize: prev.pageSize || 10,
                    totalElements: response.length,
                    totalPages: 1,
                    first: true,
                    last: true
                }))
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : String(error))
        } finally {
            setIsLoading(false)
        }
    }

    const refreshAll = async () => {
        await Promise.all([loadProducts(), loadStats()])
    }

    useEffect(() => {
        loadProducts()
        loadStats()
    }, [activeTab, pagedProducts.pageNumber, pagedProducts.pageSize])

    useEffect(() => {
        setPagedProducts(prev => ({ ...prev, pageNumber: 0 }))
    }, [searchTerm, activeTab])

    const filteredProducts = pagedProducts.content.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const FilterBarProps: FilterBarProps = {
        activeTab,
        searchTerm,
        setSearchTerm,
        setActiveTab,
        openModal
    }

    const TableProps: TableProps = {
        products: filteredProducts,
        activeTab,
        loadProducts: refreshAll,
        openModal,
        setError,
        setIsLoading
    }

    return (
        <div className="page-container">

            <Background />

            <CreateModal isOpen={isModalOpen && modalType === 'create'} onClose={closeModal} onSuccess={refreshAll} />
            <EditModal product={editingProduct} isOpen={isModalOpen && modalType === 'edit'} onClose={closeModal} onSuccess={refreshAll} />

            {isLoading && <LoadingSpinner />}

            {!isLoading &&
                <div className="page-card space-y-4 sm:space-y-5">

                    <Title page="product" />

                    <Stats {...stats} />

                    <FilterBar {...FilterBarProps} />

                    {error &&
                        <div className="text-left text-cud-vermillon text-sm font-medium">{error}</div>
                    }

                    {pagedProducts.totalElements === 0 &&
                        <div className="text-left text-slate-400 text-sm font-medium">Nincs termék</div>
                    }

                    {pagedProducts.totalElements > 0 && filteredProducts.length === 0 && (
                        <div className="text-left text-slate-400 text-sm font-medium">Nincs a keresésnek megfelelő termék</div>
                    )}

                    {filteredProducts.length > 0 && (
                        <Pagination
                            pageNumber={pagedProducts.pageNumber}
                            pageSize={pagedProducts.pageSize}
                            totalElements={pagedProducts.totalElements}
                            totalPages={pagedProducts.totalPages}
                            first={pagedProducts.first}
                            last={pagedProducts.last}
                            onPageChange={(newPageNumber) => {
                                setPagedProducts(prev => ({ ...prev, pageNumber: newPageNumber }))
                            }}
                            onPageSizeChange={(newPageSize) => {
                                setPagedProducts(prev => ({ ...prev, pageSize: newPageSize, pageNumber: 0 }))
                            }}
                        >
                            <Table {...TableProps} />
                        </Pagination>
                    )}
                </div>
            }
        </div>
    )
}