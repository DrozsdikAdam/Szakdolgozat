import { useEffect, useState, useCallback, useRef } from "react"
import { Background } from "../components/common/Background"
import { Title } from "../components/common/Title"
import { LoadingSpinner } from "../components/common/LoadingSpinner"
import { getMachines } from "../services/machineService"
import { getLatestTelemetry, getTelemetryHistory, getMachineOee } from "../services/telemetryService"
import type { MachineResponse } from "../types/machine/Machine"
import type { OeeResponse, TelemertyResponse } from "../types/telemetry/Telemetry"
import { OeeStatsCard } from "../components/analytics/OeeStatsCard"
import { LiveTelemetryCard } from "../components/analytics/LiveTelemetryCard"
import { TelemetryCharts } from "../components/analytics/TelemetryCharts"
import { AnalyticsFilterBar } from "../components/analytics/AnalyticsFilterBar"

export const AnalyticsView = () => {
    const [machines, setMachines] = useState<MachineResponse[]>([])
    const [selectedMachineId, setSelectedMachineId] = useState<string>("")
    const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d">("24h")
    const [isLive, setIsLive] = useState<boolean>(true)

    const [latestTelemetry, setLatestTelemetry] = useState<TelemertyResponse | null>(null)
    const [history, setHistory] = useState<TelemertyResponse[]>([])
    const [oee, setOee] = useState<OeeResponse | null>(null)

    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    const pollIntervalRef = useRef<number | null>(null)

    const loadMachines = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const machinesData = await getMachines(0, 100)
            setMachines(machinesData.content)
            machinesData.content.length > 0 && setSelectedMachineId(machinesData.content[0].id)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Hiba a gépek betöltésekor")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadMachines()
    }, [])

    const getStartDate = useCallback(() => {
        const now = new Date()
        if (timeRange === "1h") return new Date(now.getTime() - 60 * 60 * 1000).toISOString()

        if (timeRange === "7d") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    }, [timeRange])

    const loadTelemetryData = useCallback(async (showLoading = false) => {
        if (!selectedMachineId) return

        if (showLoading) setIsLoading(true)
        try {
            const start = getStartDate()
            const end = new Date().toISOString()

            const [latestRes, historyRes, oeeRes] = await Promise.allSettled([
                getLatestTelemetry(selectedMachineId),
                getTelemetryHistory(selectedMachineId),
                getMachineOee(selectedMachineId, start, end)
            ])

            setLatestTelemetry(latestRes.status === "fulfilled" ? latestRes.value : null)

            setHistory(historyRes.status === "fulfilled" ? historyRes.value : [])

            setOee(oeeRes.status === "fulfilled" ? oeeRes.value : null)

        } catch (err) {
            setError(err instanceof Error ? err.message : "Hiba a telemetria adatok betöltésekor")
        } finally {
            if (showLoading) setIsLoading(false)
        }
    }, [selectedMachineId, getStartDate])

    useEffect(() => {
        if (selectedMachineId) {
            loadTelemetryData(true)
        }
    }, [selectedMachineId, timeRange, loadTelemetryData])

    useEffect(() => {
        if (isLive && selectedMachineId)
            pollIntervalRef.current = window.setInterval(() => {
                loadTelemetryData(false)
            }, 5000)


        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current)
                pollIntervalRef.current = null
            }
        }
    }, [isLive, selectedMachineId, loadTelemetryData])

    return (
        <div className="page-container">
            <Background />

            {isLoading && machines.length === 0 && <LoadingSpinner />}

            <div className="page-card space-y-5">
                <Title page="analytics" />

                {error && (
                    <div className="text-left text-cud-vermillon text-sm font-medium p-3 rounded-xl bg-(--cud-vermillon-bg) border border-(--cud-vermillon-border)">
                        {error}
                    </div>
                )}

                {machines.length === 0 && !isLoading && (
                    <div className="text-center p-12 text-slate-400 font-medium">
                        Még nincs rögzített gép a rendszerben. Hozzon létre egy új gépet a Gépek menüpont alatt!
                    </div>
                )}

                {machines.length > 0 && (
                    <>
                        <AnalyticsFilterBar
                            machines={machines}
                            selectedMachineId={selectedMachineId}
                            onSelectMachine={(id) => setSelectedMachineId(id)}
                            isLive={isLive}
                            onToggleLive={() => setIsLive(prev => !prev)}
                            timeRange={timeRange}
                            onChangeTimeRange={(range) => setTimeRange(range)}
                            onRefresh={() => loadTelemetryData(true)}
                            isLoading={isLoading}
                        />

                        <OeeStatsCard oee={oee} />

                        <LiveTelemetryCard telemetry={latestTelemetry} />

                        <TelemetryCharts history={history} />
                    </>
                )}
            </div>
        </div>
    )
}
