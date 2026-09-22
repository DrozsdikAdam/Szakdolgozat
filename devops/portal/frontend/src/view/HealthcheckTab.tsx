import {
    CheckCircle2,
    HeartPulse,
    RefreshCw,
    Sliders,
    Zap,
    AlertTriangle,
    Check
} from "lucide-react";
import { useHealthchecks } from "../hooks/useHealthchecks";
import { StatCard } from "../components/common/StatCard";
import { SearchInput } from "../components/common/SearchInput";
import { Select } from "../components/common/Select";
import { Button } from "../components/common/Button";
import { EmptyState } from "../components/common/EmptyState";
import { WorkloadHealthCard } from "../components/dashboard/healthcheck/WorkloadHealthCard";
import { ProbeConfigModal } from "../components/dashboard/healthcheck/ProbeConfigModal";
import { ProbeTestResultBanner } from "../components/dashboard/healthcheck/ProbeTestResultBanner";

const namespaceOptions = [
    { value: "all", label: "Minden névtér" },
    { value: "platform-infra", label: "platform-infra" },
    { value: "app-mes", label: "app-mes" }
];

export const HealthcheckTab = () => {
    const {
        filteredWorkloads,
        loading,
        namespace,
        setNamespace,
        search,
        setSearch,
        stats,
        testingDeployment,
        activeTestResult,
        setActiveTestResult,
        isModalOpen,
        selectedWorkload,
        isSaving,
        toastMessage,
        loadData,
        handleTestProbe,
        handleSaveProbe,
        handleOpenModal,
        handleCloseModal
    } = useHealthchecks();

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 flex items-center gap-3">
                        <HeartPulse className="w-8 h-8 text-cud-teal" />
                        <span>Egészségellenőrzés & Szonda Kezelő</span>
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Kubernetes konténerek indítási (Startup), életképességi (Liveness) és készenléti (Readiness) szondáinak felügyelete és konfigurálása.
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

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Összes Workload"
                    value={stats.total}
                    icon={<Sliders className="w-5 h-5 text-cud-skyblue" />}
                    valueClassName="text-slate-100 font-mono"
                />
                <StatCard
                    title="Egészséges Podok"
                    value={stats.healthy}
                    icon={<CheckCircle2 className="w-5 h-5 text-cud-teal" />}
                    valueClassName="text-cud-teal font-mono"
                    iconBoxClassName="bg-cud-teal/10 border border-cud-teal/30 text-cud-teal"
                />
                <StatCard
                    title="Figyelem / Kritikus"
                    value={stats.warning}
                    icon={<AlertTriangle className="w-5 h-5 text-cud-orange" />}
                    valueClassName={stats.warning > 0 ? "text-cud-orange font-mono" : "text-slate-100 font-mono"}
                    iconBoxClassName="bg-cud-orange/10 border border-cud-orange/30 text-cud-orange"
                />
                <StatCard
                    title="Nincs Szonda"
                    value={stats.unconfigured}
                    icon={<Zap className="w-5 h-5 text-cud-purple" />}
                    valueClassName={stats.unconfigured > 0 ? "text-cud-purple font-mono" : "text-slate-100 font-mono"}
                    iconBoxClassName="bg-cud-purple/10 border border-cud-purple/30 text-cud-purple"
                />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="w-full sm:w-80">
                    <SearchInput
                        value={search}
                        onChange={setSearch}
                        placeholder="Keresés workload név szerint..."
                    />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <span className="text-xs text-slate-400 shrink-0 font-medium">Névtér:</span>
                    <Select
                        value={namespace}
                        onChange={(val) => setNamespace(val as string)}
                        options={namespaceOptions}
                        size="md"
                        className="w-full sm:w-48"
                    />
                </div>
            </div>

            {activeTestResult && (
                <ProbeTestResultBanner
                    deployment={activeTestResult.deployment}
                    result={activeTestResult.result}
                    onClose={() => setActiveTestResult(null)}
                />
            )}

            {filteredWorkloads.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredWorkloads.map((workload) => (
                        <WorkloadHealthCard
                            key={`${workload.namespace}-${workload.name}`}
                            workload={workload}
                            onEdit={handleOpenModal}
                            onTest={handleTestProbe}
                            isTesting={testingDeployment === workload.name}
                        />
                    ))}
                </div>
            ) : (
                <EmptyState
                    title="Nem található workload"
                    description={search ? `Nincs találat a következőre: "${search}"` : "Ebben a névtérben nincsenek elérhető workloadok."}
                    icon={<HeartPulse className="w-10 h-10 text-slate-600" />}
                />
            )}

            <ProbeConfigModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                workload={selectedWorkload}
                onSave={handleSaveProbe}
                isSaving={isSaving}
            />

            {toastMessage && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium animate-in slide-in-from-bottom-3 duration-200 ${toastMessage.type === "success"
                    ? "bg-slate-900/95 border-cud-teal/50 text-cud-teal shadow-cud-teal/10"
                    : "bg-slate-900/95 border-cud-vermillon/50 text-cud-vermillon shadow-cud-vermillon/10"
                    }`}>
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
