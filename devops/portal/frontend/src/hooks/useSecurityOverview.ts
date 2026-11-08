import { useState, useEffect, useMemo, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import type { SecurityOverviewDto, SeverityType } from "../types/security"
import type { AuditResponseDto } from "../types/audit"
import type { ToastMessage } from "../types/component/common"
import type { SecuritySubTab } from "../types/securityTab"
import { SecurityApi } from "../client/api/security"
import { AuditApi } from "../client/api/audit"

export const useSecurityOverview = (initialTab: SecuritySubTab = "vulnerabilities") => {
    const [searchParams, setSearchParams] = useSearchParams()
    const queryTab = searchParams.get("tab") as SecuritySubTab | "audit" | null
    const resolvedInitialTab: SecuritySubTab = queryTab === "audit" ? "audit" : initialTab

    const [activeTab, setActiveTab] = useState<SecuritySubTab>(resolvedInitialTab)

    const [overview, setOverview] = useState<SecurityOverviewDto | null>(null)
    const [isSecurityLoading, setIsSecurityLoading] = useState<boolean>(true)
    const [isSecurityRefreshing, setIsSecurityRefreshing] = useState<boolean>(false)
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [severityFilter, setSeverityFilter] = useState<SeverityType | 'ALL'>("ALL")
    const [componentFilter, setComponentFilter] = useState<string>('ALL')

    const [isRotateModalOpen, setIsRotateModalOpen] = useState<boolean>(false)
    const [newPassword, setNewPassword] = useState<string>('')
    const [isRotating, setIsRotating] = useState<boolean>(false)
    const [rotateError, setRotateError] = useState<string | null>(null)

    const [auditLogs, setAuditLogs] = useState<AuditResponseDto[]>([])
    const [isAuditLoading, setIsAuditLoading] = useState<boolean>(true)
    const [auditSearchQuery, setAuditSearchQuery] = useState<string>("")
    const [auditStatusFilter, setAuditStatusFilter] = useState<"ALL" | "SUCCESS" | "FAILED">("ALL")
    const [lastAuditUpdate, setLastAuditUpdate] = useState<Date | null>(null)

    const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null)

    const securityApi = useMemo(() => new SecurityApi(), [])
    const auditApi = useMemo(() => new AuditApi(), [])

    const showToast = useCallback((text: string, type: "success" | "error" = "success") => {
        setToastMessage({ text, type })
        setTimeout(() => setToastMessage(null), 4000)
    }, [])

    const handleTabChange = useCallback((tab: SecuritySubTab) => {
        setActiveTab(tab)
        setSearchParams({ tab })
    }, [setSearchParams])

    useEffect(() => {
        if (queryTab) {
            if (queryTab === "audit") {
                setActiveTab("audit")
            } else if (queryTab === "vulnerabilities") {
                setActiveTab("vulnerabilities")
            }
        }
    }, [queryTab])

    const loadSecurityData = useCallback(async (silent?: boolean) => {
        setIsSecurityLoading(!silent)
        setIsSecurityRefreshing(true)
        try {
            const res = await securityApi.getOverview()
            setOverview(res)
        } catch {
            showToast("Hiba történt a biztonsági adatok betöltésekor.", "error")
        } finally {
            setIsSecurityLoading(false)
            setIsSecurityRefreshing(false)
        }
    }, [securityApi, showToast])

    const loadAuditLogs = useCallback(async () => {
        setIsAuditLoading(true)
        try {
            const response = await auditApi.getLogs(100)
            setAuditLogs(response || [])
            setLastAuditUpdate(new Date())
        } catch {
            showToast("Nem sikerült lekérni az audit naplókat.", "error")
        } finally {
            setIsAuditLoading(false)
        }
    }, [auditApi, showToast])

    const refreshCurrentTab = useCallback(() => {
        if (activeTab === "vulnerabilities") {
            loadSecurityData(false)
        } else {
            loadAuditLogs()
        }
    }, [activeTab, loadSecurityData, loadAuditLogs])

    useEffect(() => {
        loadSecurityData()
        loadAuditLogs()
    }, [loadSecurityData, loadAuditLogs])

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

    const filteredAuditLogs = useMemo(() => {
        const query = auditSearchQuery.trim().toLowerCase()
        return auditLogs.filter(log => {
            const matchesStatus = auditStatusFilter === "ALL" || log.status === auditStatusFilter
            const matchesSearch = !query
                || log.action.toLowerCase().includes(query)
                || log.details.toLowerCase().includes(query)
                || log.id.toLowerCase().includes(query)
            return matchesStatus && matchesSearch
        })
    }, [auditLogs, auditStatusFilter, auditSearchQuery])

    const auditSuccessCount = useMemo(() => {
        return auditLogs.filter(l => l.status === "SUCCESS").length
    }, [auditLogs])

    const auditFailedCount = useMemo(() => {
        return auditLogs.filter(l => l.status === "FAILED").length
    }, [auditLogs])

    const handleRotatePassword = async (): Promise<boolean> => {
        if (!newPassword || newPassword.length < 8) {
            setRotateError("A jelszónak legalább 8 karakter hosszúnak kell lennie!")
            return false
        }
        setIsRotating(true)
        setRotateError(null)
        try {
            await securityApi.rotatePassword(newPassword)
            showToast("A jelszó sikeresen megváltoztatva!", "success")
            setIsRotateModalOpen(false)
            setNewPassword('')
            await loadSecurityData(true)
            return true
        } catch {
            setRotateError("Nem sikerült elvégezni a jelszó rotálást!")
            return false
        } finally {
            setIsRotating(false)
        }
    }

    return {
        activeTab,
        handleTabChange,
        overview,
        filteredVulnerabilities,
        isSecurityLoading,
        isSecurityRefreshing,
        searchTerm,
        setSearchTerm,
        severityFilter,
        setSeverityFilter,
        componentFilter,
        setComponentFilter,
        isRotateModalOpen,
        openRotateModal: () => setIsRotateModalOpen(true),
        closeRotateModal: () => {
            setIsRotateModalOpen(false)
            setRotateError(null)
            setNewPassword('')
        },
        newPassword,
        setNewPassword,
        isRotating,
        rotateError,
        handleRotatePassword,
        auditLogs: filteredAuditLogs,
        totalAuditCount: auditLogs.length,
        auditSuccessCount,
        auditFailedCount,
        isAuditLoading,
        auditSearchQuery,
        setAuditSearchQuery,
        auditStatusFilter,
        setAuditStatusFilter,
        lastAuditUpdate,
        refreshCurrentTab,
        toastMessage,
        setToastMessage
    }
}
