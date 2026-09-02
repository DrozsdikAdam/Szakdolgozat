import { ArrowLeft, Pencil } from "lucide-react";
import { Background } from "../../components/common/Background";
import { Title } from "../../components/common/Title";
import { useEffect, useState } from "react";
import { InputField } from "../../components/common/form/InputField";
import { TextAreaField } from "../../components/common/form/TextAreaField";
import { SelectField } from "../../components/common/form/SelectField";
import { TYPE_OPTIONS } from "../../constants/maintenanceType";
import { STATUS_OPTIONS } from "../../constants/maintenanceStatus";
import type { MaintenanceStatus, MaintenanceType } from "../../types/maintenance/MaintenanceStatus";
import { validateMinLength, validateNonNegativeNumber, validateRequired } from "../../utils/validators";
import type { MachineMaintenanceResponse, MachineMaintenanceUpdateRequest } from "../../types/maintenance/MachineMaintenance";
import { getMaintenance, updateMaintenance } from "../../services/maintenanceService";
import { SubmitButton } from "../../components/common/form/SubmitButton";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import type { UserResponse } from "../../types/user/User";
import { getAssignableUsers } from "../../services/userService";

export const MaintenanceEditView = () => {

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
    const [maintenance, setMaintenance] = useState<MachineMaintenanceResponse | null>(null)
    const [technicians, setTechnicians] = useState<UserResponse[]>([])

    const maintenanceId = useParams<{ id: string }>().id;

    const navigate = useNavigate()
    const from = useLocation().state?.from || "/maintenance"

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
            resetForm();
            navigate(from)
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

    const loadData = async () => {
        setIsLoading(true)
        try {
            const users = await getAssignableUsers()
            const technicians = users.filter(
                u => u.roles.includes("TECHNICIAN")
                    || u.roles.includes("MANAGER"));
            const maintenance = await getMaintenance(maintenanceId!);

            setTechnicians(technicians)
            setMaintenance(maintenance)
        } catch (error) {
            setError(error instanceof Error ? error.message : "Hiba a karbantartás betöltésekor")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadData();
    }, [maintenanceId])

    useEffect(() => {
        if (!maintenance) return

        setTitle(maintenance.title)
        setDescription(maintenance.description || "")
        setType(maintenance.type)
        setStatus(maintenance.status)
        setTechnicianId(maintenance.technicianId || "")
        setRouteCause(maintenance.rootCause || "")
        setActionTaken(maintenance.actionTaken || "")
        setDowntimeMinutes(maintenance.downtimeMinutes || 0)
        setCost(maintenance.cost || 0)
    }, [maintenance])

    const handleBack = () => {
        resetForm()
        navigate(from)
    }

    return (
        <div className="page-container">
            <Background />

            <div className="page-card space-y-4 sm:space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                    <button
                        onClick={() => handleBack()}
                        className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </button>

                    <Title page="maintenanceEdit" />
                </div>


                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-3.5">
                    <div className="grid grid-cols-1 md:grid-cols-2  gap-6">

                        <InputField
                            label="Kijelölt Gép"
                            value={maintenance ? `${maintenance.machineCode} - ${maintenance.machineName}` : ""}
                            disabled
                        />

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
                            value={downtimeMinutes.toString()}
                            onChange={(e) => setDowntimeMinutes(Number(e.target.value))}
                            type="number"
                            required
                        />

                        <InputField
                            label="Költség (HUF)"
                            value={downtimeMinutes.toString()}
                            onChange={(e) => setCost(Number(e.target.value))}
                            type="number"
                            required
                        />

                    </div>

                    {error &&
                        <div className="text-left text-red-400 text-sm font-medium">{error}</div>
                    }

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <SubmitButton
                            type="button"
                            variant="secondary"
                            onClick={handleBack}
                            text="Mégse"
                            className="px-4 py-2 rounded-xl"
                        />
                        <SubmitButton
                            type="submit"
                            loading={isLoading}
                            icon={<Pencil />}
                            text="Módosítás"
                            className="px-5 py-2 rounded-xl"
                        />
                    </div>
                </form>
            </div>
        </div>
    )
}
