import {
    Rocket,
    RefreshCw,
    Check,
    AlertTriangle
} from "lucide-react";
import { useDeployments } from "../hooks/useDeployments";
import { usePipelineCenter } from "../hooks/usePipelineCenter";
import { GitOpsSourceBanner } from "../components/dashboard/deployments/GitOpsSourceBanner";
import { GitOpsPipelineFlow } from "../components/dashboard/deployments/GitOpsPipelineFlow";
import { PipelineStatusCenter } from "../components/dashboard/deployments/PipelineStatusCenter";
import { StrategyFilterTabs } from "../components/dashboard/deployments/StrategyFilterTabs";
import { WorkloadDeploymentCard } from "../components/dashboard/deployments/WorkloadDeploymentCard";
import { DeploymentStrategyModal } from "../components/dashboard/deployments/DeploymentStrategyModal";
import { RollbackModal } from "../components/dashboard/deployments/RollbackModal";
import { SearchInput } from "../components/common/SearchInput";
import { Select } from "../components/common/Select";
import { Button } from "../components/common/Button";
import { EmptyState } from "../components/common/EmptyState";

const namespaceOptions = [
    { value: "all", label: "Minden névtér" },
    { value: "platform-infra", label: "platform-infra" },
    { value: "app-mes", label: "app-mes" }
];

export const DeploymentsTab = () => {
    const {
        gitRepo,
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
    } = useDeployments();

    const pipelineCenter = usePipelineCenter();

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 flex items-center gap-3">
                        <Rocket className="w-8 h-8 text-cud-orange" />
                        <span>Telepítések & GitOps Vezérlő</span>
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Deklaratív Git szinkronizáció, automatikus Self-Heal és alkalmazás-szintű rollout stratégiák (Rolling Update, Blue/Green, Canary).
                    </p>
                </div>
                <Button
                    variant="secondary"
                    size="sm"
                    icon={<RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />}
                    onClick={loadData}
                    disabled={loading}
                >
                    Frissítés
                </Button>
            </div>

            <GitOpsSourceBanner
                gitRepo={gitRepo}
                onSync={handleSyncGitOps}
                isSyncing={isSyncing}
            />

            <GitOpsPipelineFlow gitRepo={gitRepo} />

            <PipelineStatusCenter pipelineCenter={pipelineCenter} />

            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="w-full lg:w-72">
                    <SearchInput
                        value={search}
                        onChange={setSearch}
                        placeholder="Keresés alkalmazás vagy image szerint..."
                    />
                </div>

                <div className="overflow-x-auto py-0.5">
                    <StrategyFilterTabs
                        currentFilter={strategyFilter}
                        onSelectFilter={setStrategyFilter}
                        counts={strategyCounts}
                    />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto self-end lg:self-center">
                    <span className="text-xs text-slate-400 shrink-0 font-medium">Névtér:</span>
                    <Select
                        value={namespace}
                        onChange={(val) => setNamespace(val as string)}
                        options={namespaceOptions}
                        size="md"
                        className="w-full sm:w-44"
                    />
                </div>
            </div>

            {filteredWorkloads.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredWorkloads.map((workload) => (
                        <WorkloadDeploymentCard
                            key={`${workload.namespace}-${workload.name}`}
                            workload={workload}
                            onOpenStrategy={handleOpenStrategyModal}
                            onOpenRollback={handleOpenRollbackModal}
                            onQuickPromote={handleQuickPromote}
                            isMutating={isMutating}
                        />
                    ))}
                </div>
            ) : (
                <EmptyState
                    title="Nem található telepített workload"
                    description={
                        search
                            ? `Nincs találat a következőre: "${search}"`
                            : "Ebben a névtérben nincsenek elérhető deploymentek."
                    }
                    icon={<Rocket className="w-10 h-10 text-slate-600" />}
                />
            )}

            <DeploymentStrategyModal
                isOpen={isStrategyModalOpen}
                onClose={handleCloseStrategyModal}
                workload={selectedWorkload}
                onSave={handleUpdateStrategy}
                isSaving={isMutating}
            />

            <RollbackModal
                isOpen={isRollbackModalOpen}
                onClose={handleCloseRollbackModal}
                workload={selectedWorkload}
                onRollback={handleRollback}
                isRollingBack={isMutating}
            />

            {toastMessage && (
                <div
                    className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium animate-in slide-in-from-bottom-3 duration-200 ${
                        toastMessage.type === "success"
                            ? "bg-slate-900/95 border-cud-teal/50 text-cud-teal shadow-cud-teal/10"
                            : "bg-slate-900/95 border-cud-vermillon/50 text-cud-vermillon shadow-cud-vermillon/10"
                    }`}
                >
                    {toastMessage.type === "success" ? (
                        <Check className="w-4 h-4 shrink-0" />
                    ) : (
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{toastMessage.text}</span>
                </div>
            )}
        </div>
    );
};
