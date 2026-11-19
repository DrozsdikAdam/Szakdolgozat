import { CheckCircle2, XCircle } from "lucide-react"
import { useResilience } from "../hooks/useResilience"
import {
    ResilienceHeader,
    ResilienceKpiCards,
    ChaosEngineeringCard,
    JMeterLoadTestCard,
    NetworkProxyCard,
    LoadTestHistoryTable,
    ChaosHistoryTable,
    JMeterLogsModal
} from "../components/dashboard/resilience"
import type { ToastMessage } from "../types/component/common"

const getToastClass = (type: "success" | "error") => {
    if (type === "success") {
        return "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
    }
    return "bg-rose-950/90 border-rose-500/50 text-rose-200"
}

const renderToastIcon = (type: "success" | "error") => {
    if (type === "success") {
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
    }
    return <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
}

const renderToast = (toastMessage: ToastMessage | null, onClose: () => void) => {
    if (!toastMessage) {
        return null
    }

    const toastClass = getToastClass(toastMessage.type)
    const icon = renderToastIcon(toastMessage.type)

    return (
        <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium animate-in slide-in-from-bottom-3 duration-200 ${toastClass}`}
        >
            {icon}
            <span>{toastMessage.text}</span>
            <button
                type="button"
                onClick={onClose}
                className="ml-2 text-xs opacity-60 hover:opacity-100 hover:scale-110 transition-all cursor-pointer p-0.5"
                title="Bezárás"
            >
                ✕
            </button>
        </div>
    )
}

export const ResilienceTab = () => {
    const {
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
        setToastMessage
    } = useResilience()

    const proxyStatus = overview?.proxyStatus
    const activeLoadTests = overview?.activeLoadTests ?? []
    const recentLoadTests = overview?.recentLoadTests ?? []
    const recentExperiments = overview?.recentExperiments ?? []
    const averageRtoSeconds = overview?.averageRtoSeconds ?? 0
    const totalTestsRun = overview?.totalTestsRun ?? 0
    const proxyAvailable = Boolean(proxyStatus?.available)

    return (
        <div className="flex flex-col gap-6">
            <ResilienceHeader
                proxyStatus={proxyStatus}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
            />

            <ResilienceKpiCards
                averageRtoSeconds={averageRtoSeconds}
                activeLoadTestsCount={activeLoadTests.length}
                totalTestsCount={totalTestsRun}
                recentExperimentsCount={recentExperiments.length}
                proxyAvailable={proxyAvailable}
                isLoading={isLoading}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChaosEngineeringCard
                    isKillingPod={isKillingPod}
                    activeExperimentId={activeExperimentId}
                    chaosTimerSeconds={chaosTimerSeconds}
                    onTriggerPodKill={handleTriggerPodKill}
                    recentExperiments={recentExperiments}
                />

                <JMeterLoadTestCard
                    isStartingLoadTest={isStartingLoadTest}
                    onStartLoadTest={handleStartLoadTest}
                />
            </div>

            <NetworkProxyCard
                isTestingProxy={isTestingProxy}
                lastProxyResult={lastProxyResult}
                onTestProxy={handleTestNetworkProxy}
            />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <LoadTestHistoryTable
                    tests={recentLoadTests}
                    isLoading={isLoading}
                    onViewLogs={handleOpenLogs}
                />

                <ChaosHistoryTable
                    experiments={recentExperiments}
                    isLoading={isLoading}
                />
            </div>

            <JMeterLogsModal
                isOpen={Boolean(selectedJob)}
                job={selectedJob}
                isLoadingLogs={isLoadingLogs}
                onClose={handleCloseLogs}
            />

            {renderToast(toastMessage, () => setToastMessage(null))}
        </div>
    )
}
