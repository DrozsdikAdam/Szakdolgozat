import { useEffect, useMemo, useState, useCallback } from "react"
import type { KillPodRequestDto, LoadTestDetailDto, NetworkTestRequestDto, NetworkTestResponseDto, ResilienceOverviewDto, StartLoadTestDto } from "../types/resilience"
import type { ToastMessage } from "../types/component/common"
import { ResilienceApi } from "../client/api/resilience"

export const useResilience = () => {
    const [overview, setOverview] = useState<ResilienceOverviewDto | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
    const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null)

    const [isKillingPod, setIsKillingPod] = useState<boolean>(false)
    const [activeExperimentId, setActiveExperimentId] = useState<string | null>(null)
    const [chaosTimerSeconds, setChaosTimerSeconds] = useState<number>(0)

    const [isStartingLoadTest, setIsStartingLoadTest] = useState<boolean>(false)
    const [selectedJob, setSelectedJob] = useState<LoadTestDetailDto | null>(null)
    const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false)

    const [isTestingProxy, setIsTestingProxy] = useState<boolean>(false)
    const [lastProxyResult, setLastProxyResult] = useState<NetworkTestResponseDto | null>(null)

    const api = useMemo(() => new ResilienceApi(), [])

    const loadOverview = useCallback(async (showLoading = false) => {
        try {
            if (showLoading) setIsLoading(true)
            const res = await api.getOverview()
            setOverview(res)

            if (!activeExperimentId) return;

            const currentExperiment = res.recentExperiments.find(e => e.experimentId === activeExperimentId);
            if (!currentExperiment || currentExperiment.status === 'RUNNING' || currentExperiment.status === 'PENDING') return;

            setActiveExperimentId(null);

        } catch {
            setToastMessage({ type: 'error', text: "Nem sikerült betölteni az áttekintést." })
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }, [api, activeExperimentId])

    const handleRefresh = async () => {
        setIsRefreshing(true)
        await loadOverview(false)
    }

    const handleTriggerPodKill = async (request: KillPodRequestDto) => {
        try {
            setIsKillingPod(true)
            setActiveExperimentId(null)
            setChaosTimerSeconds(0)
            const res = await api.triggerPodKill(request)
            setActiveExperimentId(res.experimentId)
            setToastMessage({ type: 'success', text: "A pod sikeresen le lett állítva. Helyreállítás mérése folyamatban..." })
            await loadOverview(false)
        } catch {
            setToastMessage({ type: 'error', text: "Hiba történt a pod leállításánál." })
        } finally {
            setIsKillingPod(false)
        }
    }

    const handleStartLoadTest = async (request: StartLoadTestDto) => {
        try {
            setIsStartingLoadTest(true)
            const res = await api.startLoadTest(request)
            setToastMessage({ type: 'success', text: res.message })
            await loadOverview(false)
        } catch {
            setToastMessage({ type: 'error', text: "Nem sikerült elindítani a terheléstesztet." })
        } finally {
            setIsStartingLoadTest(false)
        }
    }

    const handleOpenLogs = async (jobName: string) => {
        try {
            setIsLoadingLogs(true)
            const res = await api.getLoadTestDetails(jobName)
            setSelectedJob(res)
        } catch {
            setToastMessage({ type: 'error', text: "Nem sikerült betölteni a terhelésteszt részleteit." })
        } finally {
            setIsLoadingLogs(false)
        }
    }

    const handleCloseLogs = () => setSelectedJob(null)

    const handleTestNetworkProxy = async (request: NetworkTestRequestDto) => {
        try {
            setIsTestingProxy(true)
            const res = await api.testNetworkProxy(request)
            setLastProxyResult(res)
            setToastMessage({ type: 'success', text: `Proxy teszt befejeződött (HTTP ${res.statusCode}, ${res.responseTimeMs} ms).` })
        } catch {
            setToastMessage({ type: 'error', text: "Hiba történt a hálózati teszt futtatása során." })
        } finally {
            setIsTestingProxy(false)
        }
    }

    useEffect(() => {
        loadOverview(true)
    }, [])

    useEffect(() => {
        const hasActiveLoadTests = Boolean(overview?.activeLoadTests && overview.activeLoadTests.length > 0)
        const isExperimentRunning = activeExperimentId !== null
        const pollIntervalMs = (hasActiveLoadTests || isExperimentRunning) ? 3000 : 15000

        const interval = setInterval(() => {
            loadOverview(false)
        }, pollIntervalMs)

        return () => clearInterval(interval)
    }, [overview, activeExperimentId, loadOverview])

    useEffect(() => {
        if (activeExperimentId === null) return
        const interval = setInterval(() => {
            setChaosTimerSeconds(prev => prev + 1)
        }, 1000)
        return () => clearInterval(interval)
    }, [activeExperimentId])

    return {
        overview,
        isLoading,
        isRefreshing,
        toastMessage,
        isKillingPod,
        activeExperimentId,
        chaosTimerSeconds,
        isStartingLoadTest,
        selectedJob,
        isLoadingLogs,
        isTestingProxy,
        lastProxyResult,
        handleRefresh,
        handleTriggerPodKill,
        handleStartLoadTest,
        handleOpenLogs,
        handleCloseLogs,
        handleTestNetworkProxy,
        loadOverview,
        setToastMessage
    }
}