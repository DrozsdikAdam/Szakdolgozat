import { useState, useEffect, useMemo, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { K8sApi } from "../client/api/k8s"
import type { UpdateHpaDto, UpdateRateLimitDto, VpaOverviewDto } from "../types/k8s"
import type { ToastMessage } from "../types/component/common"
import type { TrafficSubTab } from "../types/traffic"

export type { TrafficSubTab }

export const useTraffic = (initialTab: TrafficSubTab = "ingress") => {
    const [searchParams, setSearchParams] = useSearchParams()
    const queryTab = searchParams.get("tab") as TrafficSubTab | "autoscaling" | null
    const resolvedInitialTab: TrafficSubTab =
        queryTab === "autoscaling" || queryTab === "hpa"
            ? "hpa"
            : queryTab === "vpa"
            ? "vpa"
            : initialTab

    const [activeTab, setActiveTab] = useState<TrafficSubTab>(resolvedInitialTab)

    const [currentRps, setCurrentRps] = useState<number>(100)
    const [selectRps, setSelectRps] = useState<number>(100)
    const [currentBurst, setCurrentBurst] = useState<number>(5)
    const [selectBurst, setSelectBurst] = useState<number>(5)
    const [isLoadingRateLimit, setIsLoadingRateLimit] = useState<boolean>(false)
    const [isSavingRateLimit, setIsSavingRateLimit] = useState<boolean>(false)

    const [currentHpa, setCurrentHpa] = useState<UpdateHpaDto | null>(null)
    const [selectMinReplicas, setSelectMinReplicas] = useState<number>(2)
    const [selectMaxReplicas, setSelectMaxReplicas] = useState<number>(10)
    const [selectTargetCpu, setSelectTargetCpu] = useState<number>(80)
    const [isSavingHpa, setIsSavingHpa] = useState<boolean>(false)

    const [currentVpa, setCurrentVpa] = useState<VpaOverviewDto | null>(null)
    const [selectMode, setSelectMode] = useState<'Auto' | 'Off'>('Off')
    const [selectMinCpu, setSelectMinCpu] = useState<string>('100m')
    const [selectMaxCpu, setSelectMaxCpu] = useState<string>('1000m')
    const [selectMinMemory, setSelectMinMemory] = useState<string>('128Mi')
    const [selectMaxMemory, setSelectMaxMemory] = useState<string>('2Gi')
    const [isSavingVpa, setIsSavingVpa] = useState<boolean>(false)

    const [isLoadingAutoscale, setIsLoadingAutoscale] = useState<boolean>(false)
    const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null)
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

    const k8sApi = useMemo(() => new K8sApi(), [])

    const showToast = useCallback((text: string, type: "success" | "error" = "success") => {
        setToastMessage({ text, type })
        setTimeout(() => setToastMessage(null), 4000)
    }, [])

    const handleTabChange = useCallback((tab: TrafficSubTab) => {
        setActiveTab(tab)
        setSearchParams({ tab })
    }, [setSearchParams])

    const fetchRateLimit = useCallback(async () => {
        try {
            setIsLoadingRateLimit(true)
            const rateLimitConfig = await k8sApi.getRateLimit()
            setCurrentRps(rateLimitConfig.rps)
            setSelectRps(rateLimitConfig.rps)
            setCurrentBurst(rateLimitConfig.burst ?? 5)
            setSelectBurst(rateLimitConfig.burst ?? 5)
            setLastUpdate(new Date())
        } catch {
            showToast("Hiba a forgalomkorlát lekérdezése során!", "error")
        } finally {
            setIsLoadingRateLimit(false)
        }
    }, [k8sApi, showToast])

    const fetchAutoscaling = useCallback(async () => {
        try {
            setIsLoadingAutoscale(true)
            const [hpaData, vpaData] = await Promise.all([
                k8sApi.getHpa(),
                k8sApi.getVpa()
            ])

            setCurrentHpa(hpaData)
            setSelectMinReplicas(hpaData.minReplicas)
            setSelectMaxReplicas(hpaData.maxReplicas)
            setSelectTargetCpu(hpaData.targetCpuUtil)

            setCurrentVpa(vpaData)
            setSelectMode(vpaData.updateMode ?? 'Off')
            setSelectMinCpu(vpaData.minAllowedCpu ?? '100m')
            setSelectMaxCpu(vpaData.maxAllowedCpu ?? '1000m')
            setSelectMinMemory(vpaData.minAllowedMemory ?? '128Mi')
            setSelectMaxMemory(vpaData.maxAllowedMemory ?? '2Gi')

            setLastUpdate(new Date())
        } catch {
            showToast("Hiba az autoscaling adatok lekérdezése során!", "error")
        } finally {
            setIsLoadingAutoscale(false)
        }
    }, [k8sApi, showToast])

    const refreshAll = useCallback(() => {
        fetchRateLimit()
        fetchAutoscaling()
    }, [fetchRateLimit, fetchAutoscaling])

    useEffect(() => {
        refreshAll()
    }, [refreshAll])

    useEffect(() => {
        if (queryTab) {
            if (queryTab === "autoscaling" || queryTab === "hpa") {
                setActiveTab("hpa")
            } else if (queryTab === "vpa") {
                setActiveTab("vpa")
            } else if (queryTab === "ingress") {
                setActiveTab("ingress")
            }
        }
    }, [queryTab])

    const saveRateLimit = useCallback(async () => {
        try {
            setIsSavingRateLimit(true)
            const request: UpdateRateLimitDto = {
                rps: selectRps,
                burst: selectBurst
            }
            await k8sApi.updateRateLimit(request)
            setCurrentRps(selectRps)
            setCurrentBurst(selectBurst)
            setLastUpdate(new Date())
            showToast(`A kéréskorlát sikeresen frissítve az Ingress rétegen: ${selectRps} RPS (Puffer: ${selectBurst}x)`, "success")
        } catch {
            showToast("Hiba történt a beállítás mentése során!", "error")
        } finally {
            setIsSavingRateLimit(false)
        }
    }, [k8sApi, selectRps, selectBurst, showToast])

    const saveHpa = useCallback(async () => {
        try {
            setIsSavingHpa(true)
            await k8sApi.updateHpa({
                minReplicas: selectMinReplicas,
                maxReplicas: selectMaxReplicas,
                targetCpuUtil: selectTargetCpu,
                currentReplicas: currentHpa?.currentReplicas ?? selectMinReplicas
            })

            setCurrentHpa((prev) =>
                prev
                    ? {
                        ...prev,
                        minReplicas: selectMinReplicas,
                        maxReplicas: selectMaxReplicas,
                        targetCpuUtil: selectTargetCpu
                    }
                    : null
            )
            setLastUpdate(new Date())
            showToast(`HPA beállítások sikeresen mentve: Min: ${selectMinReplicas}, Max: ${selectMaxReplicas}, Cél CPU: ${selectTargetCpu}%`, "success")
        } catch {
            showToast("Hiba történt a HPA határok mentése során!", "error")
        } finally {
            setIsSavingHpa(false)
        }
    }, [k8sApi, selectMinReplicas, selectMaxReplicas, selectTargetCpu, currentHpa, showToast])

    const saveVpa = useCallback(async () => {
        try {
            setIsSavingVpa(true)
            await k8sApi.updateVpa({
                updateMode: selectMode,
                minAllowedCpu: selectMinCpu,
                maxAllowedCpu: selectMaxCpu,
                minAllowedMemory: selectMinMemory,
                maxAllowedMemory: selectMaxMemory
            })

            setCurrentVpa((prev) =>
                prev
                    ? {
                        ...prev,
                        updateMode: selectMode,
                        minAllowedCpu: selectMinCpu,
                        maxAllowedCpu: selectMaxCpu,
                        minAllowedMemory: selectMinMemory,
                        maxAllowedMemory: selectMaxMemory
                    }
                    : null
            )
            setLastUpdate(new Date())
            showToast(`VPA konfiguráció sikeresen elmentve: ${selectMode} mód (${selectMinCpu}-${selectMaxCpu} CPU, ${selectMinMemory}-${selectMaxMemory} RAM)`, "success")
        } catch {
            showToast("Hiba történt a VPA konfiguráció mentése során!", "error")
        } finally {
            setIsSavingVpa(false)
        }
    }, [k8sApi, selectMode, selectMinCpu, selectMaxCpu, selectMinMemory, selectMaxMemory, showToast])

    return {
        activeTab,
        handleTabChange,
        currentRps,
        selectRps,
        setSelectRps,
        currentBurst,
        selectBurst,
        setSelectBurst,
        isSavingRateLimit,
        saveRateLimit,
        currentHpa,
        selectMinReplicas,
        setSelectMinReplicas,
        selectMaxReplicas,
        setSelectMaxReplicas,
        selectTargetCpu,
        setSelectTargetCpu,
        isSavingHpa,
        saveHpa,
        currentVpa,
        selectMode,
        setSelectMode,
        selectMinCpu,
        setSelectMinCpu,
        selectMaxCpu,
        setSelectMaxCpu,
        selectMinMemory,
        setSelectMinMemory,
        selectMaxMemory,
        setSelectMaxMemory,
        isSavingVpa,
        saveVpa,
        isGlobalLoading: isLoadingRateLimit || isLoadingAutoscale,
        toastMessage,
        setToastMessage,
        lastUpdate,
        refreshAll
    }
}
