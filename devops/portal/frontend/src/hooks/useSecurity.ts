import { useEffect, useMemo, useState } from "react"
import type { SecurityOverviewDto, SeverityType } from "../types/security"
import type { ToastMessage } from "../types/component/common"
import { SecurityApi } from "../client/api/security"

export const useSecurityHook = () => {
    const [overview, setOverview] = useState<SecurityOverviewDto | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
    const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null)

    const [searchTerm, setSearchTerm] = useState<string>("")
    const [severityFilter, setSeverityFilter] = useState<SeverityType | 'ALL'>("ALL")
    const [componentFilter, setComponentFilter] = useState<string>('ALL')

    const [isRotateModalOpen, setIsRotateModalOpen] = useState<boolean>(false)
    const [newPassword, setNewPassword] = useState<string>('')
    const [isRotating, setIsRotating] = useState<boolean>(false)
    const [rotateError, setRotateError] = useState<string | null>(null)

    const api = useMemo(() => new SecurityApi(), [])

    const loadData = async (silent?: boolean) => {
        setIsLoading(!silent)
        setIsRefreshing(true)
        try {
            const res = await api.getOverview()
            setOverview(res)
        } catch {
            setToastMessage({ text: "Hiba történt a biztonsági adatok betöltésekor.", type: "error" })
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }

    useEffect(() => {
        loadData()
        const interval = setInterval(() => {
            loadData(true)
        }, 30000)
        return () => clearInterval(interval)
    }, [])

    const filteredVulnerabilities = useMemo(() => {
        const list = overview?.vulnerabilities.items || []
        const cleanSearch = searchTerm.trim().toLowerCase()

        return list.filter(v => {
            const matchesSearch = !cleanSearch
                || v.cveId.toLowerCase().includes(cleanSearch)
                || v.packageName.toLowerCase().includes(cleanSearch)
                || v.description.toLowerCase().includes(cleanSearch)

            const matchesSeverity = severityFilter === 'ALL' || v.severity === severityFilter
            const matchesComponent = componentFilter === 'ALL' || v.source.toLowerCase().includes(componentFilter.toLowerCase())

            return matchesSearch && matchesSeverity && matchesComponent
        })
    }, [overview, searchTerm, severityFilter, componentFilter])

    const passwordValidator = (): boolean => {
        const clean = newPassword.trim()
        if (clean.length < 8) {
            setRotateError("A jelszónak legalább 8 karakter hosszúnak kell lennie.")
            return false
        }
        if (!/[A-Z]/.test(clean)) {
            setRotateError("A jelszónak tartalmaznia kell legalább egy nagybetűt (A-Z).")
            return false
        }
        if (!/[a-z]/.test(clean)) {
            setRotateError("A jelszónak tartalmaznia kell legalább egy kisbetűt (a-z).")
            return false
        }
        if (!/[0-9]/.test(clean)) {
            setRotateError("A jelszónak tartalmaznia kell legalább egy számjegyet (0-9).")
            return false
        }
        if (!/[^A-Za-z0-9]/.test(clean)) {
            setRotateError("A jelszónak tartalmaznia kell legalább egy speciális karaktert (pl. !@#$%).")
            return false
        }
        setRotateError(null)
        return true
    }

    const openModal = () => setIsRotateModalOpen(true)

    const closeModal = () => {
        setIsRotateModalOpen(false)
        setNewPassword('')
        setRotateError(null)
    }

    const handleRotatePassword = async (): Promise<boolean> => {
        if (!passwordValidator()) return false

        setIsRotating(true)
        try {
            const res = await api.rotatePassword(newPassword.trim())
            setToastMessage({ text: res.message || "A jelszó sikeresen rotálva!", type: "success" })
            closeModal()
            await loadData(true)
            return true
        } catch (error) {
            const msg = (error as Error)?.message || "Nem sikerült a jelszó rotálása."
            setRotateError(msg)
            setToastMessage({ text: msg, type: "error" })
            return false
        } finally {
            setIsRotating(false)
        }
    }

    return {
        overview,
        filteredVulnerabilities,
        isLoading,
        isRefreshing,
        toastMessage,
        setToastMessage,
        searchTerm,
        setSearchTerm,
        severityFilter,
        setSeverityFilter,
        componentFilter,
        setComponentFilter,
        isRotateModalOpen,
        newPassword,
        setNewPassword,
        isRotating,
        rotateError,
        openModal,
        closeModal,
        handleRotatePassword,
        handleRefresh: () => loadData(false)
    }
}