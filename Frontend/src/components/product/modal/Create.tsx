import { Plus } from "lucide-react"
import type { ProductCreateRequest } from "../../../types/product/Product"
import { useState } from "react"
import { createProduct } from "../../../services/productService"
import { Modal } from "../../common/Modal"
import { validateRequired, validateMinLength, validateMaxLength } from "../../../utils/validators"
import type { CreateModalProps } from "../../../types/product/ProductProps"
import { InputField } from "../../common/form/InputField"
import { TextAreaField } from "../../common/form/TextAreaField"

export const CreateModal = ({ isOpen, onClose, onSuccess }: CreateModalProps) => {
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [isModalError, setIsModalError] = useState<string | null>(null)
    const [formCreateData, setFormCreateData] = useState<ProductCreateRequest>({
        sku: "",
        name: "",
        description: "",
        unit: ""
    })

    function isValid(): boolean {
        const error = validateRequired(formCreateData.sku, "cikkszám")
            || validateMinLength(formCreateData.name, 5, "cikk megnevezése")
            || validateMinLength(formCreateData.unit, 2, "mértékegység")
            || validateMaxLength(formCreateData.description, 50, "leírás")

        if (error) {
            setIsModalError(error)
            return false
        }
        return true
    }

    const handleSubmit = async () => {
        setIsModalError(null)
        if (!isValid()) return
        setIsLoading(true)
        try {
            await createProduct(formCreateData)
            setFormCreateData({ sku: "", name: "", description: "", unit: "" })
            onClose()
            onSuccess()
        } catch (error) {
            setIsModalError(error instanceof Error ? error.message : String(error))
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) return null;

    return (
        <Modal
            title="Új termék létrehozása"
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={isModalError}
            submitText="Létrehozás"
            submitIcon={<Plus size={18} />}
            cancelText="Mégse"
        >
            <InputField
                label="Cikkszám"
                placeholder="Pl. PROD-001"
                value={formCreateData.sku}
                onChange={(e) => setFormCreateData({ ...formCreateData, sku: e.target.value })}
            />
            <InputField
                label="Cikk megnevezése"
                placeholder="Pl. Fém alkatrész X"
                value={formCreateData.name}
                onChange={(e) => setFormCreateData({ ...formCreateData, name: e.target.value })}
            />
            <TextAreaField
                label="Leírás"
                rows={2}
                placeholder="Rövid termékleírás..."
                value={formCreateData.description || ""}
                onChange={(e) => setFormCreateData({ ...formCreateData, description: e.target.value })}
            />
            <InputField
                label="Mértékegység"
                placeholder="Pl. db, kg, m"
                value={formCreateData.unit}
                onChange={(e) => setFormCreateData({ ...formCreateData, unit: e.target.value })}
            />
        </Modal>
    )
}
