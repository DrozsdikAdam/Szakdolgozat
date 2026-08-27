import { ActivateButton, DeactivateButton, DeleteButton, EditButton, RestoreButton } from "./Buttons"
import type { ActivateProps, DeactivateProps, DeleteProps, EditProps, OperationProps, RestoreProps } from "../../types/product/ProductProps"
import {
    deactivateProduct,
    activateProduct,
    restoreProduct,
    deleteProduct,
} from "../../services/productService"
import { DeleteConfirmModal } from "../common/DeleteConfirmModal"
import { useState } from "react"

export const OperationButtons = ({ product, activeTab, loadProducts, openModal, setError, setIsLoading }: OperationProps) => {

    const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false)

    const handleDeactivateProduct = async (id: string) => {
        try {
            setIsLoading(true)
            await deactivateProduct(id)
            await loadProducts()
        } catch (error) {
            setError(error instanceof Error ? error.message : String(error))
        } finally {
            setIsLoading(false)
        }
    }

    const handleActivateProduct = async (id: string) => {
        try {
            setIsLoading(true)
            await activateProduct(id)
            await loadProducts()
        } catch (error) {
            setError(error instanceof Error ? error.message : String(error))
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteProduct = async (id: string) => {
        try {
            setIsLoading(true)
            await deleteProduct(id)
            await loadProducts()
        } catch (error) {
            setError(error instanceof Error ? error.message : String(error))
        } finally {
            setIsLoading(false)
            setIsDeleteOpen(false)
        }
    }

    const handleRestoreProduct = async (id: string) => {
        try {
            setIsLoading(true)
            await restoreProduct(id)
            await loadProducts()
        } catch (error) {
            setError(error instanceof Error ? error.message : String(error))
        } finally {
            setIsLoading(false)
        }
    }

    const id = product.id

    const restoreProps: RestoreProps = {
        id,
        handleRestoreProduct
    }

    const editProps: EditProps = {
        product,
        openModal
    }

    const deleteProps: DeleteProps = {
        id,
        handleDeleteProduct: () => setIsDeleteOpen(true)
    }

    const activateProps: ActivateProps = {
        id,
        handleActivateProduct
    }

    const deactivateProductProps: DeactivateProps = {
        id,
        handleDeactivateProduct
    }

    if (activeTab === "deleted") {
        return (
            <div className="flex gap-1.5 items-center justify-center">
                <RestoreButton {...restoreProps} />
            </div>
        )
    }

    if (activeTab === "active") {
        return (

            <div className="flex gap-1.5 items-center justify-center">
                <DeleteConfirmModal
                    isOpen={isDeleteOpen}
                    onClose={() => setIsDeleteOpen(false)}
                    onConfirm={() => handleDeleteProduct(product.id)}
                    title="Törlés"
                    message={`Biztosan törli a terméket: ${product.name}?`}
                />
                <EditButton {...editProps} />
                <DeactivateButton {...deactivateProductProps} />
                <DeleteButton {...deleteProps} />
            </div>
        )
    }

    if (activeTab === "inactive") {
        return (
            <div className="flex gap-1.5 items-center justify-center">
                <DeleteConfirmModal
                    isOpen={isDeleteOpen}
                    onClose={() => setIsDeleteOpen(false)}
                    onConfirm={() => handleDeleteProduct(product.id)}
                    title="Törlés"
                    message={`Biztosan törli a terméket: ${product.name}?`}
                />
                <EditButton {...editProps} />
                <ActivateButton {...activateProps} />
                <DeleteButton {...deleteProps} />
            </div>
        )
    }

    return null
}