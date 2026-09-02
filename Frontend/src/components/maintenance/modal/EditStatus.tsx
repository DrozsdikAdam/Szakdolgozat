import { useEffect, useState } from "react"
import type { MachineMaintenanceUpdateStatusRequest } from "../../../types/maintenance/MachineMaintenance"
import type { MaintenanceStatusModalProps } from "../../../types/maintenance/MaintenanceProps"
import type { MaintenanceStatus } from "../../../types/maintenance/MaintenanceStatus"
import { updateMaintenanceStatus } from "../../../services/maintenanceService"
import { validateNonNegativeNumber, validateRequired } from "../../../utils/validators"
import { Modal } from "../../common/Modal"
import { RefreshCw } from "lucide-react"
import { InputField } from "../../common/form/InputField"
import { STATUS_OPTIONS } from "../../../constants/maintenanceStatus"
import { SelectField } from "../../common/form/SelectField"
import { TextAreaField } from "../../common/form/TextAreaField"

export const EditMaintenanceStatusModal = ({ isOpen, onClose, onSuccess, maintenance, technicians }: MaintenanceStatusModalProps) => {

    const [status, setStatus] = useState<MaintenanceStatus>("IN_PROGRESS")
    const [technicianId, setTechnicianId] = useState<string>("")
    const [rootCause, setRootCause] = useState<string>("")
    const [actionTaken, setActionTaken] = useState<string>("")
    const [downtimeMinutes, setDowntimeMinutes] = useState<number>(0)
    const [cost, setCost] = useState<number>(0)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    const isValid = (): boolean => {
        let err = validateNonNegativeNumber(downtimeMinutes, "állásidő")
            || validateNonNegativeNumber(cost, "költség")
            || (status === "IN_PROGRESS" && validateRequired(technicianId, "technikus"))
            || (status === "COMPLETED" && validateRequired(rootCause, "hiba oka"))
            || (status === "COMPLETED" && validateRequired(actionTaken, "javítási művelet"))
            || (status === "COMPLETED" && validateRequired(technicianId, "technikus"));

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

        const maintenanceData: MachineMaintenanceUpdateStatusRequest = {
            status,
            technicianId,
            rootCause,
            actionTaken,
            downtimeMinutes,
            cost,
            end: status === "COMPLETED" ? new Date().toISOString() : undefined
        }
        if (!maintenance) return;

        try {
            await updateMaintenanceStatus(maintenance.id, maintenanceData)
            onSuccess()
            resetForm()
            onClose()
        } catch (error) {
            setError(error instanceof Error ? error.message : "Hiba a státusz frissítése közben")
        } finally {
            setIsLoading(false)
        }
    }

    const resetForm = () => {
        setStatus("IN_PROGRESS")
        setTechnicianId("")
        setRootCause("")
        setActionTaken("")
        setDowntimeMinutes(0)
        setCost(0)
        setError(null)
        setIsLoading(false)
    }

    useEffect(() => {
        resetForm()
        if (!isOpen || !maintenance) return;
        setStatus(maintenance.status || "IN_PROGRESS")
        setTechnicianId(maintenance.technicianId || "")
        setRootCause(maintenance.rootCause || "")
        setActionTaken(maintenance.actionTaken || "")
        setDowntimeMinutes(maintenance.downtimeMinutes || 0)
        setCost(maintenance.cost || 0)
    }, [isOpen, maintenance])

    if (!isOpen || !maintenance) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Állapot frissítése"
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            submitText="Mentés"
            submitIcon={<RefreshCw size={18} />}
            cancelText="Mégse"
        >
            <InputField
                label="Kijelölt Gép"
                value={maintenance ? `${maintenance.machineCode} - ${maintenance.machineName}` : ""}
                disabled
            />

            <InputField
                label="Hibajelenség / Cím"
                value={maintenance ? maintenance.title : ""}
                disabled
            />

            <SelectField
                label="Karbantartás állapota"
                value={status}
                onChange={(e) => setStatus(e.target.value as MaintenanceStatus)}
                options={STATUS_OPTIONS.map(s => ({ key: s.key, label: s.label }))}
            />

            {(status === "IN_PROGRESS" || status === "COMPLETED") && (
                <SelectField
                    label="Felelős technikus"
                    value={technicianId}
                    placeholderOption=" -- válassz ki egy technikust --"
                    onChange={(e) => setTechnicianId(e.target.value)}
                    options={(technicians || []).map(t => ({ key: t.id, label: t.username }))}
                    required
                />
            )}

            {status === "COMPLETED" && (
                <>
                    <InputField
                        label="Hiba oka"
                        value={rootCause}
                        onChange={(e) => setRootCause(e.target.value)}
                    />

                    <TextAreaField
                        label="Elvégzett javítási művelet"
                        value={actionTaken}
                        onChange={(e) => setActionTaken(e.target.value)}
                        placeholder={"Részletesen írja le a elvégzett javítási műveletet."}
                    />

                    <InputField
                        label="Állásidő (perc)"
                        value={downtimeMinutes}
                        onChange={(e) => setDowntimeMinutes(Number(e.target.value) || 0)}
                        type="number"
                        min={0}
                        required
                    />

                    <InputField
                        label="Költség (Ft)"
                        value={cost}
                        onChange={(e) => setCost(Number(e.target.value) || 0)}
                        type="number"
                        min={0}
                        required
                    />
                </>
            )}
        </Modal>
    )

}