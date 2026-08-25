import { useState, useEffect } from "react"

import type { UpdateMachineModalProps } from "../../../types/machine/MachineProps"
import type { MachineStatus, MachineType } from "../../../types/machine/MachineStatus"
import type { MachineUpdateRequest } from "../../../types/machine/Machine"
import { updateMachine } from "../../../services/machineService"
import { Modal } from "../../common/Modal"
import { SelectField } from "../../common/form/SelectField"
import { InputField } from "../../common/form/InputField"
import { Pencil } from "lucide-react"
import { MACHINE_TYPE_OPTIONS } from "../../../constants/machineType"
import { MACHINE_STATUS_OPTIONS } from "../../../constants/machineStatus"
import { validatePositiveNumber, validateRequired } from "../../../utils/validators"

export const EditMachineModal = ({ isOpen, onClose, onSuccess, machine, users }: UpdateMachineModalProps) => {

    const [name, setName] = useState<string>("")
    const [code, setCode] = useState<string>("")
    const [type, setType] = useState<MachineType>("CNC")
    const [status, setStatus] = useState<MachineStatus>("IDLE")
    const [idealCycleTimeSeconds, setIdealCycleTimeSeconds] = useState<number>(0)
    const [targetPcsPerHour, setTargetPcsPerHour] = useState<number>(0)
    const [manufacturer, setManufacturer] = useState<string>("")
    const [model, setModel] = useState<string>("")
    const [serialNumber, setSerialNumber] = useState<string>("")
    const [warrantyEndDate, setWarrantyEndDate] = useState<string>("")
    const [warrantyNumber, setWarrantyNumber] = useState<string>("")
    const [location, setLocation] = useState<string>("")
    const [assignedUserId, setAssignedUserId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(false)

    const isValid = (): boolean => {
        const err = validateRequired(code, "gyári azonosító")
            || validateRequired(name, "megnevezés")
            || validateRequired(type, "gép típusa")
            || validateRequired(status, "gép állapota")
            || validatePositiveNumber(idealCycleTimeSeconds, "ideális ciklusidő")
            || validatePositiveNumber(targetPcsPerHour, "cél darabszám / óra");
        if (err) {
            setError(err);
            return false;
        }
        return true;
    }

    const handleSubmit = async () => {
        if (!isValid()) return

        if (!machine) return

        setIsLoading(true)
        setError(null)

        const request: MachineUpdateRequest = {
            code,
            name,
            type,
            status,
            idealCycleTimeSeconds,
            targetPcsPerHour,
            manufacturer,
            model,
            serialNumber,
            warrantyEndDate,
            warrantyNumber,
            location,
            assignedUserId: assignedUserId || undefined
        }

        try {
            await updateMachine(machine.id, request)
            onSuccess()
            resetForm()
            onClose()
        } catch (error) {
            setError(error instanceof Error ? error.message : "Ismeretlen hiba történt")
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
        setWarrantyEndDate("");
        setWarrantyNumber("");
        setLocation("");
        setAssignedUserId(null);
        setError(null);
        setIsLoading(false);
    }

    useEffect(() => {
        if (!isOpen || !machine) return;

        setName(machine.name || "")
        setCode(machine.code || "")
        setType(machine.type || "CNC")
        setStatus(machine.status || "OFFLINE")
        setIdealCycleTimeSeconds(machine.idealCycleTimeSeconds || 0)
        setTargetPcsPerHour(machine.targetPcsPerHour || 0)
        setManufacturer(machine.manufacturer || "")
        setModel(machine.model || "")
        setSerialNumber(machine.serialNumber || "")
        setWarrantyEndDate(machine.warrantyEndDate ? machine.warrantyEndDate.split("T")[0] : "")
        setWarrantyNumber(machine.warrantyNumber || "")
        setLocation(machine.location || "")
        setAssignedUserId(machine.assignedUserId || null)
        setError(null)
        setIsLoading(false)

    }, [isOpen, machine])

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Gép szerkesztése"
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            submitText="Szerkesztés"
            submitIcon={<Pencil size={18} />}
            cancelText="Mégse"
        >

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

        </Modal>
    )
}