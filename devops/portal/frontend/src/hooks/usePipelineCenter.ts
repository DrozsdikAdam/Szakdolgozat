import { useCallback, useEffect, useMemo, useState } from "react"
import type { GitOpsDriftReport, PipelineRun, RolloutActionRequest } from "../types/pipeline"
import type { ToastMessage } from "../types/component/common"
import { PipelineApi } from "../client/api/pipeline"

export const usePipelineCenter = () => {
    const [runs, setRuns] = useState<PipelineRun[]>([])
    const [driftReport, setDriftReport] = useState<GitOpsDriftReport | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

    const [selectedRunForApproval, setSelectedRunForApproval] = useState<PipelineRun | null>(null)
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState<boolean>(false)
    const [isTriggering, setIsTriggering] = useState<boolean>(false)
    const [isApproving, setIsApproving] = useState<boolean>(false)
    const [isRolloutActing, setIsRolloutActing] = useState<boolean>(false)
    const [activeStrategy, setActiveStrategy] = useState<'canary' | 'bluegreen'>('bluegreen')
    const [appNamespace, setAppNamespace] = useState<string>("app-mes")
    const [appName, setAppName] = useState<string>("mes-backend")
    const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null)
    const api = useMemo(() => new PipelineApi(), []);

    const showToast = useCallback((text: string, type: "success" | "error" = "success") => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage(null), 4500);
    }, []);

    const loadData = useCallback(async (silent?: boolean) => {
        try {
            if (!silent) setIsLoading(true);
            setIsRefreshing(true);
            const [response, driftResponse, config] = await Promise.all([
                api.getPipelineRuns(),
                api.getGitOpsDrift(),
                api.getPipelineConfig().catch(() => null)
            ]);
            setRuns(response);
            setDriftReport(driftResponse);
            if (config?.defaultStrategy) {
                setActiveStrategy(config.defaultStrategy);
            }
            if (config?.appNamespace) {
                setAppNamespace(config.appNamespace);
            }
            if (config?.defaultAppName) {
                setAppName(config.defaultAppName);
            }
        } catch (error) {
            showToast("Hiba történt az adatok betöltése közben", "error");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [api, showToast]);

    const handleTriggerPipeline = async (branch?: string): Promise<void> => {
        setIsTriggering(true);
        try {
            const res = await api.triggerPipeline(branch);
            showToast(res.message || "Pipeline futtatás sikeresen kezdeményezve!", "success");
            await loadData(true);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Nem sikerült elindítani a pipeline-t.";
            showToast(message, "error");
        } finally {
            setIsTriggering(false);
        }
    };

    const handleOpenApprovalModal = (run: PipelineRun): void => {
        setSelectedRunForApproval(run);
        setIsApprovalModalOpen(true);
    };

    const handleCloseApprovalModal = (): void => {
        setSelectedRunForApproval(null);
        setIsApprovalModalOpen(false);
    };

    const handleApprovePipeline = async (decision: "approved" | "rejected", comment?: string): Promise<void> => {
        if (!selectedRunForApproval) return;

        setIsApproving(true);
        try {
            const res = await api.approvePipeline(selectedRunForApproval.id, {
                runId: selectedRunForApproval.id,
                decision,
                approver: "DevOps Engineer",
                comment
            });
            showToast(res.message || `Jóváhagyási döntés rögzítve: ${decision}`, "success");
            handleCloseApprovalModal();
            await loadData(true);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Nem sikerült a jóváhagyási döntés rögzítése.";
            showToast(message, "error");
        } finally {
            setIsApproving(false);
        }
    };

    const handleRolloutAction = async (action: RolloutActionRequest["action"], full: boolean = false): Promise<void> => {
        setIsRolloutActing(true);
        try {
            const res = await api.executeRolloutAction({
                action,
                full
            });
            showToast(res.message || `Rollout művelet (${action}) sikeresen elküldve!`, "success");
            await loadData(true);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Nem sikerült a rollout művelet végrehajtása.";
            showToast(message, "error");
        } finally {
            setIsRolloutActing(false);
        }
    };

    const handleSwitchStrategy = async (strategy: 'canary' | 'bluegreen'): Promise<void> => {
        if (strategy === activeStrategy) return;

        setIsRolloutActing(true);
        try {
            await api.updatePipelineStrategy(strategy);
            setActiveStrategy(strategy);
            showToast(`Telepítési stratégia sikeresen átállítva: ${strategy === 'bluegreen' ? 'Blue-Green (Kék/Zöld)' : 'Canary (Fokozatos)'}!`, "success");
            await loadData(true);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Nem sikerült átállítani a stratégiát.";
            showToast(message, "error");
        } finally {
            setIsRolloutActing(false);
        }
    };

    useEffect(() => {
        loadData();
        const intervalId = setInterval(() => {
            loadData(true);
        }, 10000);

        return () => clearInterval(intervalId);
    }, [loadData]);

    return {
        runs,
        driftReport,
        isLoading,
        isRefreshing,
        selectedRunForApproval,
        isApprovalModalOpen,
        isTriggering,
        isApproving,
        isRolloutActing,
        activeStrategy,
        appNamespace,
        appName,
        toastMessage,
        loadData,
        handleTriggerPipeline,
        handleOpenApprovalModal,
        handleCloseApprovalModal,
        handleApprovePipeline,
        handleRolloutAction,
        handleSwitchStrategy
    };
};