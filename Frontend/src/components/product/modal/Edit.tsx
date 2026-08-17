import { Pencil } from "lucide-react"
import type { ProductUpdateRequest } from "../../../types/product/Product"
import { useState, useEffect } from "react"
import { updateProduct } from "../../../services/productService"
import { validateMaxLength, validateMinLength, validateRequired } from "../../../utils/validators"
import type { EditModalProps } from "../../../types/product/ProductProps"
import { Modal } from "../../common/Modal"
import { InputField } from "../../common/form/InputField"
import { TextAreaField } from "../../common/form/TextAreaField"

export const EditModal = ({ product, isOpen, onClose, onSuccess }: EditModalProps) => {
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [formEditData, setFormEditData] = useState<ProductUpdateRequest>({
        name: "",
        sku: "",
        description: "",
        unit: ""
    })

    useEffect(() => {
        if (product) {
            setFormEditData({
                name: product.name,
                sku: product.sku,
                description: product.description || "",
                unit: product.unit
            })
        }
    }, [product])

    if (!isOpen || !product) return null;

    function isValid(): boolean {
        const error = validateRequired(formEditData.sku, "cikkszám")
            || validateMinLength(formEditData.name, 5, "cikk megnevezése")
            || validateMinLength(formEditData.unit, 2, "mértékegység")
            || validateMaxLength(formEditData.description, 50, "leírás")

        if (error) {
            setError(error)
            return false
        }
        return true
    }

    const handleSubmit = async () => {
        setError(null)
        if (!isValid()) return
        setIsLoading(true)

        try {
            await updateProduct(product.id, formEditData)
            onClose()
            onSuccess()
        } catch (error) {
            setError(error instanceof Error ? error.message : String(error))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Termék módosítása"
            submitIcon={<Pencil size={16} />}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            submitText="Mentés"
            cancelText="Mégsem"
        >
            <InputField
                label="Cikkszám"
                disabled
                value={formEditData.sku || ""}
                className="font-mono text-slate-400 cursor-not-allowed bg-slate-800/40"
            />
            <InputField
                label="Cikk megnevezése"
                value={formEditData.name || ""}
                onChange={(e) => setFormEditData({ ...formEditData, name: e.target.value })}
            />
            <TextAreaField
                label="Leírás"
                rows={2}
                value={formEditData.description || ""}
                onChange={(e) => setFormEditData({ ...formEditData, description: e.target.value })}
            />
            <InputField
                label="Mértékegység"
                value={formEditData.unit || ""}
                onChange={(e) => setFormEditData({ ...formEditData, unit: e.target.value })}
            />
        </Modal>
    )
}
