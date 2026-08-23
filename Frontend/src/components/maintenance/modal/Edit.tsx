import { useEffect, useState } from "react";
import type { UpdateMaintenanceModalProps } from "../../../types/maintenance/MaintenanceProps";
import type { MaintenanceStatus, MaintenanceType } from "../../../types/maintenance/MaintenanceStatus";
import { validateMinLength, validateNonNegativeNumber, validateRequired } from "../../../utils/validators";
import { Modal } from "../../common/Modal";
import { Pencil } from "lucide-react";
import type { MachineMaintenanceUpdateRequest } from "../../../types/maintenance/MachineMaintenance";
import { updateMaintenance } from "../../../services/maintenanceService";
import { InputField } from "../../common/form/InputField";
import { SelectField } from "../../common/form/SelectField";
import { TYPE_OPTIONS } from "../../../constants/maintenanceType";
import { STATUS_OPTIONS } from "../../../constants/maintenanceStatus";
import { TextAreaField } from "../../common/form/TextAreaField";

export const EditMaintenanceModal = ({ isOpen, onClose, onSuccess, maintenance, machines, technicians }: UpdateMaintenanceModalProps) => {

    const [title, setTitle] = useState<string>("")
    const [description, setDescription] = useState<string>("")
    const [type, setType] = useState<MaintenanceType>("PREVENTIVE")
    const [status, setStatus] = useState<MaintenanceStatus>("SCHEDULED")
    const [technicianId, setTechnicianId] = useState<string>("")
    const [rootCause, setRouteCause] = useState<string>("")
    const [actionTaken, setActionTaken] = useState<string>("")
    const [downtimeMinutes, setDowntimeMinutes] = useState<number>(0)
    const [cost, setCost] = useState<number>(0)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    const isValid = (): boolean => {
        const err = validateRequired(title, "cím")
            || validateMinLength(title, 3, "cím")
            || validateNonNegativeNumber(downtimeMinutes, "állásidő")
            || validateNonNegativeNumber(cost, "költség")

        if (err) {
            setError(err)
            return false
        }
        return true
    }


    const handleSubmit = async () => {
        if (!isValid()) return
        setIsLoading(true)
        setError(null)

        const maintenanceData: MachineMaintenanceUpdateRequest = {
            title,
            description,
            type,
            status,
            technicianId,
            rootCause,
            actionTaken,
            downtimeMinutes,
            cost
        }
        if (!maintenance) return

        try {
            await updateMaintenance(maintenance.id, maintenanceData);
            onSuccess();
            resetForm();
            onClose();
        } catch (error) {
            setError(error instanceof Error ? error.message : "Hiba a karbantartás frissítése közben")
        } finally {
            setIsLoading(false)
        }
    }

    const resetForm = () => {
        setTitle("")
        setDescription("")
        setType("PREVENTIVE")
        setStatus("SCHEDULED")
        setTechnicianId("")
        setRouteCause("")
        setActionTaken("")
        setDowntimeMinutes(0)
        setCost(0)
        setIsLoading(false)
        setError(null)
    }

    useEffect(() => {
        if (!isOpen || !maintenance) return

        setTitle(maintenance.title)
        setDescription(maintenance.description || "")
        setType(maintenance.type)
        setStatus(maintenance.status)
        setTechnicianId(maintenance.technicianId || "")
        setRouteCause(maintenance.rootCause || "")
        setActionTaken(maintenance.actionTaken || "")
        setDowntimeMinutes(maintenance.downtimeMinutes)
        setCost(maintenance.cost)
    }, [isOpen, maintenance])

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Karbantartás szerkesztése"
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            submitText="Mentés"
            submitIcon={<Pencil size={18} />}
            cancelText="Mégse"
        >
            <InputField
                label="Cím / Hibajelenség"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={"pl. Féléves nagykarbantartás, vágókés szorulás..."}
                required
            />

            <SelectField
                label="Karbantartás típusa"
                value={type}
                onChange={(e) => setType(e.target.value as MaintenanceType)}
                options={TYPE_OPTIONS.map(t => ({ key: t.key, label: t.label }))}
            />

            <SelectField
                label="Karbantartás állapota"
                value={status}
                onChange={(e) => setStatus(e.target.value as MaintenanceStatus)}
                options={STATUS_OPTIONS.map(s => ({ key: s.key, label: s.label }))}
            />

            <SelectField
                label="Felelős technikus"
                value={technicianId}
                onChange={(e) => setTechnicianId(e.target.value)}
                options={(technicians || []).map(t => ({ key: t.id, label: t.username }))}
                placeholderOption="-- Nincs felelős technikus --"
            />

            <TextAreaField
                label="Részletes leírás"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={"Kérjük, adja meg a hiba részletes leírását."}
            />

            <InputField
                label="Hiba oka"
                value={rootCause}
                onChange={(e) => setRouteCause(e.target.value)}
            />

            <TextAreaField
                label="Elvégzett javítási művelet"
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
            />

            <InputField
                label="Állásidő (perc)"
                value={downtimeMinutes}
                onChange={(e) => setDowntimeMinutes(Number(e.target.value))}
                type="number"
                required
            />

            <InputField
                label="Költség (HUF)"
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                type="number"
                required
            />

        </Modal>
    )
}