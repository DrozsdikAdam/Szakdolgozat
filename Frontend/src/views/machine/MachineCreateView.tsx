import { useEffect, useState } from "react"
import { Background } from "../../components/common/Background"
import { useLocation, useNavigate } from "react-router-dom"
import { Title } from "../../components/common/Title"
import type { MachineStatus, MachineType } from "../../types/machine/MachineStatus"
import { createMachine } from "../../services/machineService"
import type { MachineCreateRequest } from "../../types/machine/Machine"
import { validatePositiveNumber, validateRequired } from "../../utils/validators"
import { InputField } from "../../components/common/form/InputField"
import { SelectField } from "../../components/common/form/SelectField"
import { MACHINE_STATUS_OPTIONS } from "../../constants/machineStatus"
import { MACHINE_TYPE_OPTIONS } from "../../constants/machineType"
import type { UserResponse } from "../../types/user/User"
import { getUsers } from "../../services/userService"
import { ArrowLeft, Plus } from "lucide-react"
import { SubmitButton } from "../../components/common/form/SubmitButton"

export const MachineCreateView = () => {

    const navigate = useNavigate()
    const from = useLocation().state?.from || "/machine"
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    const [name, setName] = useState<string>("");
    const [code, setCode] = useState<string>("");
    const [type, setType] = useState<MachineType>("CNC");
    const [status, setStatus] = useState<MachineStatus>("OFFLINE");
    const [idealCycleTimeSeconds, setIdealCycleTimeSeconds] = useState<number>(0);
    const [targetPcsPerHour, setTargetPcsPerHour] = useState<number>(0);
    const [manufacturer, setManufacturer] = useState<string>("");
    const [model, setModel] = useState<string>("");
    const [serialNumber, setSerialNumber] = useState<string>("");
    const [warrantyNumber, setWarrantyNumber] = useState<string>("");
    const [warrantyEndDate, setWarrantyEndDate] = useState<string>("");
    const [location, setLocation] = useState<string>("");
    const [assignedUserId, setAssignedUserId] = useState<string>("");

    const [users, setUsers] = useState<UserResponse[]>([])

    const isValid = (): boolean => {
        const err = validateRequired(code, "gyári azonosító")
            || validateRequired(name, "megnevezés")
            || validateRequired(type, "gép típusa")
            || validateRequired(status, "gép állapota")
            || validatePositiveNumber(idealCycleTimeSeconds, "ideális ciklusidő")
            || validatePositiveNumber(targetPcsPerHour, "cél darabszám / óra");
        if (err) {
            setError(err)
            return false
        }
        return true
    }

    const handleBack = () => {
        resetForm();
        navigate(from)
    }

    const handleSubmit = async () => {
        if (!isValid()) return
        setIsLoading(true);
        setError(null);

        const request: MachineCreateRequest = {
            name,
            code,
            type,
            status,
            idealCycleTimeSeconds,
            targetPcsPerHour,
            manufacturer,
            model,
            serialNumber,
            warrantyNumber,
            warrantyEndDate,
            location,
            assignedUserId: assignedUserId || undefined
        }

        try {
            await createMachine(request);
            resetForm();
            navigate(from)
        } catch (error) {
            setError(error instanceof Error ? error.message : "Hozzáadás sikertelen")
        } finally {
            setIsLoading(false)
        }

    }

    const resetForm = () => {
        setName("");
        setCode("");
        setType("CNC");
        setStatus("OFFLINE");
        setIdealCycleTimeSeconds(0);
        setTargetPcsPerHour(0);
        setManufacturer("");
        setModel("");
        setSerialNumber("");
        setWarrantyNumber("");
        setWarrantyEndDate("");
        setLocation("");
        setAssignedUserId("");
        setIsLoading(false)
        setError(null)
    }

    const loadData = async () => {
        setIsLoading(true)
        try {
            const users = await getUsers()
            const operators = users.filter(
                u => u.roles.includes("OPERATOR")
                    || u.roles.includes("TECHNICIAN")
                    || u.roles.includes("MANAGER"));
            setUsers(operators)
        } catch (error) {
            setError(error instanceof Error ? error.message : "Hozzáadás sikertelen")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        resetForm()
        loadData()
    }, [])

    return (
        <div className="relative flex-1 w-full flex flex-col items-center justify-start p-4 sm:p-6 font-sans">
            <Background />

            <div className="w-full max-w-7xl backdrop-blur-xl bg-slate-900/60 border border-slate-800 shadow-2xl rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 relative z-10">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                    <button
                        onClick={() => handleBack()}
                        className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </button>

                    <Title page="machineCreate" />
                </div>


                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-3.5">
                    <div className="grid grid-cols-1 md:grid-cols-2  gap-6">
                        <InputField
                            label="Gyári azonosító"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder={"pl. DMG60"}
                        />

                        <InputField
                            label="Megnevezés"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={"pl. maró gép"}
                        />

                        <SelectField
                            label="Gép típusa"
                            value={type}
                            onChange={(e) => setType(e.target.value as MachineType)}
                            options={MACHINE_TYPE_OPTIONS.map(t => ({ key: t.key, label: t.label }))}
                            required
                        />

                        <SelectField
                            label="Gép állapota"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as MachineStatus)}
                            options={MACHINE_STATUS_OPTIONS.map(t => ({ key: t.key, label: t.label }))}
                            required
                        />

                        <InputField
                            label="Ideális ciklusidő (másodperc)"
                            value={idealCycleTimeSeconds.toString()}
                            onChange={(e) => setIdealCycleTimeSeconds(Number(e.target.value))}
                            placeholder={"pl. 10"}
                            type="number"
                            min={0}
                        />

                        <InputField
                            label="Cél darabszám / óra"
                            value={targetPcsPerHour.toString()}
                            onChange={(e) => setTargetPcsPerHour(Number(e.target.value))}
                            placeholder={"pl. 10"}
                            type="number"
                            min={0}
                        />

                        <InputField
                            label="Gyártó"
                            value={manufacturer}
                            onChange={(e) => setManufacturer(e.target.value)}
                            placeholder={"pl. DMG"}
                        />

                        <InputField
                            label="Gyártási szám"
                            value={serialNumber}
                            onChange={(e) => setSerialNumber(e.target.value)}
                            placeholder={"pl. 123456789"}
                        />

                        <InputField
                            label="Garanciális szám"
                            value={warrantyNumber}
                            onChange={(e) => setWarrantyNumber(e.target.value)}
                            placeholder={"pl. 123456789"}
                        />

                        <InputField
                            label="Garancia vége"
                            value={warrantyEndDate}
                            onChange={(e) => setWarrantyEndDate(e.target.value)}
                            placeholder={"pl. 2024-12-31"}
                            type="date"
                        />

                        <InputField
                            label="Telephely"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder={"pl. Budapest"}
                        />

                        <SelectField
                            label="Üzemeltető"
                            value={assignedUserId}
                            onChange={(e) => setAssignedUserId(e.target.value)}
                            placeholderOption="-- Válassz üzemeltetőt (opcionális) --"
                            options={users.map(t => ({ key: t.id, label: t.username }))}
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
                            icon={<Plus />}
                            text="Hozzáadás"
                            className="px-5 py-2 rounded-xl"
                        />
                    </div>

                </form>

            </div>


        </div>
    )
}