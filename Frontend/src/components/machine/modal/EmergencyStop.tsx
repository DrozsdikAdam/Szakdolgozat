import type { EmergencyStopModalProps } from "../../../types/machine/MachineProps"
import { Modal } from "../../common/modal/Modal";
import { useState } from "react";
import type { EmergencyStopRequest } from "../../../types/machine/Machine";
import { emergencyStop } from "../../../services/machineService";
import { PowerOff } from "lucide-react";
import { SelectField } from "../../common/form/SelectField";
import { TextAreaField } from "../../common/form/TextAreaField";
import { validateRequired } from "../../../utils/validators";

export const EmergencyStopModal = ({ isOpen, onClose, onSuccess, machineId, technicians }: EmergencyStopModalProps) => {

    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState<EmergencyStopRequest>({
        reason: "",
        description: "",
        technicianId: ""
    })

    const reasons = [
        "Szerszámtörés", "Túlmelegedés", "Mechanikai elakadás", "Rezgési anomália", "Anyagelakadás"
    ]


    const isValid = (): boolean => {
        const err = validateRequired(formData.reason, "A hiba típusa kötelező!");
        if (err) {
            setError(err);
            return false;
        }
        return true;
    }


    const handleSubmit = async () => {
        if (!isValid()) return
        setIsLoading(true)
        setError(null)

        const payload: EmergencyStopRequest = {
            reason: formData.reason,
            description: formData.description || undefined,
            technicianId: formData.technicianId ? formData.technicianId : undefined
        };

        try {
            await emergencyStop(machineId, payload);
            onSuccess();
            resetForm();
            onClose();
        } catch (error) {
            setError(error instanceof Error ? error.message : "Ismeretlen hiba történt")
        } finally {
            setIsLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            reason: "",
            description: "",
            technicianId: ""
        })
        setError(null)
        setIsLoading(false)
    }

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Vészleállás rögzítése"
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            submitText="Mentés"
            submitIcon={<PowerOff size={18} />}
            cancelText="Mégse"
            submitVariant="danger"
        >
            <SelectField
                label="Hiba típusa"
                name="reason"
                value={formData.reason}
                placeholderOption="-- Válasszon hiba okot --"
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                options={reasons.map((reason) => ({ key: reason, label: reason }))}
            />

            <TextAreaField
                label="Leírás"
                name="description"
                placeholder="Add meg a probléma leírását"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <SelectField
                label="Technikus"
                name="technicianId"
                value={formData.technicianId}
                onChange={(e) => setFormData({ ...formData, technicianId: e.target.value })}
                options={technicians.map((technician) => ({ key: technician.id, label: technician.username }))}
            />
        </Modal>
    )
}