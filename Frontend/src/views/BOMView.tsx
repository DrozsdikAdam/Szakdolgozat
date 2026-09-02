import { useEffect, useState } from "react"
import { Background } from "../components/common/Background"
import type { ProductResponse } from "../types/product/Product"
import type { BOMTreeNode } from "../types/bom/bom"
import { getActiveProducts } from "../services/productService"
import { getBOMTree } from "../services/bomService"
import { LoadingSpinner } from "../components/common/LoadingSpinner"
import { Title } from "../components/common/Title"
import { BOMSelectBar } from "../components/bom/SelectBar"
import { AddBOMComponent } from "../components/bom/modal/AddComponent"
import { BOMTreeView } from "../components/bom/TreeView"

export const BOMView = () => {

    const [products, setProducts] = useState<ProductResponse[]>([])
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
    const [quantity, setQuantity] = useState<number>(1)
    const [treeNode, setTreeNode] = useState<BOMTreeNode | null>(null)
    const [isModalOpen, setModalOpen] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    const loadProducts = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await getActiveProducts()
            setProducts(response)
        } catch (error) {
            setError(error instanceof Error ? error.message : "Ismeretlen hiba történt!")
        } finally {
            setIsLoading(false)
        }
    }

    const loadTreeNodes = async () => {
        if (selectedProductId && quantity > 0) {
            setIsLoading(true)
            setError(null)
            try {
                const response = await getBOMTree(selectedProductId, quantity)
                setTreeNode(response)
            } catch (error) {
                setError(error instanceof Error ? error.message : "Ismeretlen hiba történt!")
            } finally {
                setIsLoading(false)
            }
        }
    }

    useEffect(() => {
        loadProducts()
    }, [])

    useEffect(() => {
        loadTreeNodes()
    }, [selectedProductId, quantity])

    return (
        <div className="page-container">

            <Background />

            <AddBOMComponent
                isOpen={isModalOpen}
                closeModal={() => setModalOpen(false)}
                parentProductId={selectedProductId || ""}
                products={products}
                onSuccess={loadTreeNodes} />

            {isLoading && <LoadingSpinner />}

            {!isLoading &&
                <div className="page-card space-y-4 sm:space-y-5">
                    <Title page="bom" />

                    <BOMSelectBar
                        products={products}
                        selectedProductId={selectedProductId}
                        setSelectedProductId={setSelectedProductId}
                        quantity={quantity}
                        setQuantity={setQuantity}
                        openAddModal={() => setModalOpen(true)}
                    />

                    {error &&
                        <div className="text-left text-rose-400 text-sm font-medium">{error}</div>
                    }

                    {products.length === 0 &&
                        <div className="text-left text-slate-400 text-sm font-medium">Nincs aktív termék</div>
                    }

                    {products.length > 0 &&
                        <BOMTreeView treeNodes={treeNode || null} />
                    }
                </div>
            }
        </div>
    )
}