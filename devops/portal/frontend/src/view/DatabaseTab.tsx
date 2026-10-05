import { RefreshCw, CheckCircle2, XCircle, Database } from "lucide-react";
import { useDatabase } from "../hooks/useDatabase";
import {
    DatabaseMetricCards,
    EngineSelectorCard,
    ReplicaScalingCard,
    ConnectionConfigCard,
    MigrationStepperCard,
    CutoverScheduleModal
} from "../components/dashboard/database";
import { Button } from "../components/common/Button";
import type { ToastMessage } from "../types/component/common";

const getToastClass = (type: "success" | "error") => {
    if (type === "success") {
        return "bg-emerald-950/90 border-emerald-500/50 text-emerald-200";
    }
    return "bg-rose-950/90 border-rose-500/50 text-rose-200";
};

const renderToast = (toastMessage: ToastMessage | null, onClose: () => void) => {
    if (!toastMessage) return null;

    const toastClass = getToastClass(toastMessage.type);
    const Icon = toastMessage.type === "success" ? CheckCircle2 : XCircle;
    const iconColor = toastMessage.type === "success" ? "text-emerald-400" : "text-rose-400";

    return (
        <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium animate-in slide-in-from-bottom-3 duration-200 ${toastClass}`}
        >
            <Icon className={`w-5 h-5 shrink-0 ${iconColor}`} />
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
    );
};

export const DatabaseTab = () => {
    const {
        overview,
        isLoading,
        isRefreshing,
        toastMessage,
        form,
        isFormDirty,
        isPinging,
        pingResult,
        isScaling,
        isSaving,
        isMigrating,
        activeMigrationJob,
        cutoverStatus,
        isSchedulingCutover,
        isCancellingCutover,
        isCutoverModalOpen,
        setIsCutoverModalOpen,
        handleRefresh,
        handleEngineChange,
        handleModeChange,
        handleFieldChange,
        handleTestConnection,
        handleScale,
        handleSaveConfig,
        handleStartMigration,
        handleScheduleCutover,
        handleCancelCutover
    } = useDatabase();

    const targetEngineForCutover = activeMigrationJob?.targetEngine || (form.engine === "postgres" ? "mssql" : "postgres");

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-cud-teal-bg border border-cud-teal-border text-cud-teal">
                        <Database className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            Adatbázis Menedzsment (DBaaS)
                        </h1>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Magas rendelkezésre állású (HA) relációs klaszterek, automatikus feladatátvétel és Zero-Downtime migráció.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant="secondary"
                        size="md"
                        loading={isRefreshing}
                        disabled={isRefreshing || isLoading}
                        onClick={handleRefresh}
                        icon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />}
                    >
                        Állapot Frissítése
                    </Button>
                </div>
            </div>

            <DatabaseMetricCards
                overview={overview}
                isLoading={isLoading}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="flex flex-col gap-6">
                    <EngineSelectorCard
                        selectedEngine={form.engine}
                        selectedMode={form.mode}
                        onEngineChange={handleEngineChange}
                        onModeChange={handleModeChange}
                        disabled={isSaving || isScaling || isMigrating}
                    />

                    <ConnectionConfigCard
                        formData={form}
                        isDirty={isFormDirty}
                        isPinging={isPinging}
                        isSaving={isSaving}
                        pingResult={pingResult}
                        onFieldChange={handleFieldChange}
                        onTestConnection={handleTestConnection}
                        onSaveConfig={handleSaveConfig}
                        disabled={isMigrating}
                    />
                </div>

                <div className="flex flex-col gap-6">
                    <ReplicaScalingCard
                        replicas={form.replicas}
                        poolSize={form.poolSize}
                        maxReplicas={overview?.maxReplicas || 5}
                        isScaling={isScaling}
                        onReplicasChange={(n) => handleFieldChange("replicas", n)}
                        onPoolSizeChange={(p) => handleFieldChange("poolSize", p)}
                        onApplyScale={() => handleScale(form.replicas, form.poolSize)}
                        disabled={isSaving || isMigrating}
                    />

                    <MigrationStepperCard
                        currentEngine={form.engine}
                        isMigrating={isMigrating}
                        activeJob={activeMigrationJob}
                        onStartMigration={handleStartMigration}
                        onOpenCutoverModal={() => setIsCutoverModalOpen(true)}
                        hasActiveCutoverSchedule={cutoverStatus?.status === "SCHEDULED"}
                        disabled={isSaving || isScaling}
                    />
                </div>
            </div>

            <CutoverScheduleModal
                isOpen={isCutoverModalOpen}
                onClose={() => setIsCutoverModalOpen(false)}
                targetEngine={targetEngineForCutover}
                currentEngine={form.engine}
                cutoverStatus={cutoverStatus}
                isScheduling={isSchedulingCutover}
                isCancelling={isCancellingCutover}
                onScheduleCutover={handleScheduleCutover}
                onCancelCutover={handleCancelCutover}
            />

            {renderToast(toastMessage, () => { })}
        </div>
    );
};
