import { useState } from "react";
import { Modal } from "../../common/Modal";
import type { MaintenanceStatus, MaintenanceType } from "../../../types/maintenance/MaintenanceStatus";
import { Plus } from "lucide-react";
import type { MachineMaintenanceCreateRequest } from "../../../types/maintenance/MachineMaintenance";
import { createMaintenance } from "../../../services/maintenanceService";
import type { CreateMaintenanceModalProps } from "../../../types/maintenance/MaintenanceProps";
import { SelectField } from "../../common/form/SelectField";
import { InputField } from "../../common/form/InputField";
import { TYPE_OPTIONS } from "../../../constants/maintenanceType";
import { TextAreaField } from "../../common/form/TextAreaField";

export const CreateMaintenanceModal = ({ isOpen, onClose, onSuccess, machines, technicians }: CreateMaintenanceModalProps) => {

    const [machineId, setMachineId] = useState<string>("")
    const [title, setTitle] = useState<string>("")
    const [description, setDescription] = useState<string>("")
    const [type, setType] = useState<MaintenanceType>("CORRECTIVE")
    const [status, setStatus] = useState<MaintenanceStatus>("SCHEDULED")
    const [technicianId, setTechnicianId] = useState<string>("")
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async () => {
        setIsLoading(true)
        setError(null)

        const maintenanceData: MachineMaintenanceCreateRequest = {
            machineId,
            title,
            description,
            type,
            status,
            technicianId
        }
        try {

            await createMaintenance(maintenanceData);
            onSuccess();
            onClose();
            resetForm();
        } catch (error) {
            setError(error instanceof Error ? error.message : "Ismeretlen hiba történt")
        } finally {
            setIsLoading(false)
        }
    }

    const resetForm = () => {
        setMachineId("")
        setTitle("")
        setDescription("")
        setType("CORRECTIVE")
        setStatus("SCHEDULED")
        setTechnicianId("")
        setError(null)
    }

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Új karbantartás létrehozása"
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            submitText="Létrehozás"
            submitIcon={<Plus size={18} />}
            cancelText="Mégse"
        >
            <SelectField
                label="Gép"
                value={machineId}
                onChange={(e) => setMachineId(e.target.value)}
                options={machines.map(m => ({ key: m.id, label: `${m.code} - ${m.name} ` }))}
                required
            />

            <InputField
                label="Cím / Hibajelenség"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={"pl. Féléves nagykarbantartás, vágókés szorulás..."}
            />

            <SelectField
                label="Karbantartás Típusa"
                value={type}
                onChange={(e) => setType(e.target.value as MaintenanceType)}
                options={TYPE_OPTIONS.map(t => ({ key: t.key, label: t.label }))}
                required
            />

            <SelectField
                label="Felelős Technikus"
                value={technicianId}
                onChange={(e) => setTechnicianId(e.target.value)}
                placeholderOption="Válassz technikust (opcionális)..."
                options={(technicians || []).map(t => ({ key: t.id, label: t.username }))}
            />

            <TextAreaField
                label="Részletes leírás"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={"Kérjük, adja meg a hiba részletes leírását."}
            />

        </Modal>
    )
}