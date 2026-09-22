import { useState, useEffect, useMemo, useCallback } from "react";
import { DeploymentApi } from "../client/api/deployments";
import type {
    DeploymentsOverviewDto,
    WorkloadDeploymentDto,
    UpdateDeploymentStrategyDto,
    RollbackDeploymentDto,
    GitRepoConfig
} from "../types/deployments";
import type { StrategyFilterType } from "../types/component/deployments/strategyFilterTabsProps";

export type { StrategyFilterType };

export interface ToastMessage {
    text: string;
    type: "success" | "error";
}

export const useDeployments = () => {
    const [overview, setOverview] = useState<DeploymentsOverviewDto | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [namespace, setNamespace] = useState<string>("all");
    const [strategyFilter, setStrategyFilter] = useState<StrategyFilterType>("all");
    const [search, setSearch] = useState<string>("");

    const [isSyncing, setIsSyncing] = useState<boolean>(false);
    const [selectedWorkload, setSelectedWorkload] = useState<WorkloadDeploymentDto | null>(null);
    const [isStrategyModalOpen, setIsStrategyModalOpen] = useState<boolean>(false);
    const [isRollbackModalOpen, setIsRollbackModalOpen] = useState<boolean>(false);
    const [isMutating, setIsMutating] = useState<boolean>(false);

    const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);

    const api = useMemo(() => new DeploymentApi(), []);

    const showToast = useCallback((text: string, type: "success" | "error" = "success") => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage(null), 4500);
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getDeployments(namespace);
            setOverview(data);
        } catch (err: any) {
            console.error("Nem sikerült lekérni a deployment és GitOps adatokat:", err);
            showToast("Nem sikerült elérni a deployment és GitOps adatokat a klaszterből.", "error");
        } finally {
            setLoading(false);
        }
    }, [api, namespace, showToast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSyncGitOps = async () => {
        setIsSyncing(true);
        try {
            const res = await api.syncGitOps();
            setOverview(res);
            showToast("A GitOps szinkronizáció sikeresen befejeződött a 'main' ágon!", "success");
        } catch (err: any) {
            showToast(`Hiba a GitOps szinkronizáció során: ${err.message || err}`, "error");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleOpenStrategyModal = (workload: WorkloadDeploymentDto) => {
        setSelectedWorkload(workload);
        setIsStrategyModalOpen(true);
    };

    const handleCloseStrategyModal = () => {
        setIsStrategyModalOpen(false);
    };

    const handleOpenRollbackModal = (workload: WorkloadDeploymentDto) => {
        setSelectedWorkload(workload);
        setIsRollbackModalOpen(true);
    };

    const handleCloseRollbackModal = () => {
        setIsRollbackModalOpen(false);
    };

    const handleUpdateStrategy = async (dto: UpdateDeploymentStrategyDto) => {
        setIsMutating(true);
        try {
            const updated = await api.updateStrategy(dto);
            showToast(`A(z) '${dto.deploymentName}' telepítési stratégiája sikeresen módosítva: ${dto.strategy}.`, "success");
            setIsStrategyModalOpen(false);

            setOverview(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    workloads: prev.workloads.map(w =>
                        w.name === dto.deploymentName && w.namespace === dto.namespace ? updated : w
                    )
                };
            });
            await loadData();
        } catch (err: any) {
            showToast(`Nem sikerült frissíteni a stratégiát: ${err.message || err}`, "error");
        } finally {
            setIsMutating(false);
        }
    };

    const handleRollback = async (dto: RollbackDeploymentDto) => {
        setIsMutating(true);
        try {
            const rolledBack = await api.rollback(dto);
            showToast(`A(z) '${dto.deploymentName}' sikeresen visszaállítva a #${dto.targetRevision}. revízióra!`, "success");
            setIsRollbackModalOpen(false);

            setOverview(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    workloads: prev.workloads.map(w =>
                        w.name === dto.deploymentName && w.namespace === dto.namespace ? rolledBack : w
                    )
                };
            });
            await loadData();
        } catch (err: any) {
            showToast(`Hiba a visszaállítás (rollback) során: ${err.message || err}`, "error");
        } finally {
            setIsMutating(false);
        }
    };

    const handleQuickPromote = async (workload: WorkloadDeploymentDto) => {
        if (workload.strategy !== "BlueGreen") return;
        setIsMutating(true);
        try {
            const updated = await api.updateStrategy({
                deploymentName: workload.name,
                namespace: workload.namespace,
                strategy: "BlueGreen",
                promoteBlueGreen: true
            });
            const newColor = updated.blueGreenActive === "green" ? "Zöld" : "Kék";
            showToast(`A forgalom sikeresen átkapcsolva az aktív környezetre (${newColor})!`, "success");

            setOverview(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    workloads: prev.workloads.map(w =>
                        w.name === workload.name && w.namespace === workload.namespace ? updated : w
                    )
                };
            });
        } catch (err: any) {
            showToast(`Hiba a forgalom átkapcsolásakor: ${err.message || err}`, "error");
        } finally {
            setIsMutating(false);
        }
    };

    const filteredWorkloads = useMemo(() => {
        const query = search.trim().toLowerCase();
        const list = overview?.workloads || [];

        return list.filter((w) => {
            const matchesSearch =
                !query ||
                w.name.toLowerCase().includes(query) ||
                w.namespace.toLowerCase().includes(query) ||
                w.currentImage.toLowerCase().includes(query);

            const matchesNamespace = namespace === "all" || w.namespace === namespace;
            const matchesStrategy = strategyFilter === "all" || w.strategy === strategyFilter;

            return matchesSearch && matchesNamespace && matchesStrategy;
        });
    }, [overview?.workloads, search, namespace, strategyFilter]);

    const strategyCounts = useMemo(() => {
        const list = overview?.workloads || [];
        const nsList = namespace === "all" ? list : list.filter(w => w.namespace === namespace);
        return {
            all: nsList.length,
            RollingUpdate: nsList.filter(w => w.strategy === "RollingUpdate").length,
            Canary: nsList.filter(w => w.strategy === "Canary").length,
            BlueGreen: nsList.filter(w => w.strategy === "BlueGreen").length
        };
    }, [overview?.workloads, namespace]);

    const gitRepo: GitRepoConfig | null = overview?.gitRepo || null;

    return {
        overview,
        gitRepo,
        workloads: overview?.workloads || [],
        filteredWorkloads,
        strategyCounts,
        loading,
        namespace,
        setNamespace,
        strategyFilter,
        setStrategyFilter,
        search,
        setSearch,
        isSyncing,
        selectedWorkload,
        isStrategyModalOpen,
        isRollbackModalOpen,
        isMutating,
        toastMessage,
        loadData,
        handleSyncGitOps,
        handleOpenStrategyModal,
        handleCloseStrategyModal,
        handleOpenRollbackModal,
        handleCloseRollbackModal,
        handleUpdateStrategy,
        handleRollback,
        handleQuickPromote
    };
};
