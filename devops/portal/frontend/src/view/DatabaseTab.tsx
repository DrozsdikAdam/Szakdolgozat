import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useDatabase } from "../hooks/useDatabase";
import { useBackupHistory } from "../hooks/useBackupHistory";
import type { DatabaseTabProps, DatabaseSubTab } from "../types/databaseTab";
import { DATABASE_TAB_OPTIONS } from "../constants/databaseTab";
import {
    DatabaseMetricCards,
    EngineSelectorCard,
    ConnectionConfigCard,
    ReplicaScalingCard,
    MigrationStepperCard,
    CutoverScheduleModal
} from "../components/dashboard/database";
import { BackupStats } from "../components/dashboard/backup/Stats";
import { BackupTable } from "../components/dashboard/backup/Table";
import { RestoreModal } from "../components/dashboard/backup/RestoreModal";
import { SearchInput } from "../components/common/SearchInput";
import { SegmentedControl } from "../components/common/SegmentedControl";
import { Button } from "../components/common/Button";
import { CheckCircle2, Database, Play, RefreshCw, XCircle } from "lucide-react";

export const DatabaseTab = ({ initialTab = "engines" }: DatabaseTabProps) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const queryTab = searchParams.get("tab") as DatabaseSubTab | "backup" | null;
    const resolvedInitialTab: DatabaseSubTab = queryTab === "backup" ? "backups" : (queryTab || initialTab);

    const [activeTab, setActiveTab] = useState<DatabaseSubTab>(resolvedInitialTab);

    const {
        overview,
        isLoading: isDbLoading,
        isRefreshing: isDbRefreshing,
        toastMessage: dbToast,
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
        handleRefresh: handleDbRefresh,
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

    const {
        history,
        isLoading: isBackupLoading,
        isTriggeringBackup,
        isRestoring,
        searchQuery: backupSearch,
        setSearchQuery: setBackupSearch,
        selectedRestore,
        isModalOpen: isRestoreModalOpen,
        toastMessage: backupToast,
        setToastMessage: setBackupToast,
        syncedCount,
        loadBackups,
        handleTriggerBackup,
        handleOpenRestore,
        handleCloseModal: handleCloseRestoreModal,
        handleConfirmRestore
    } = useBackupHistory();

    const handleTabChange = useCallback((tab: DatabaseSubTab) => {
        setActiveTab(tab);
        setSearchParams({ tab });
    }, [setSearchParams]);

    useEffect(() => {
        if (queryTab) {
            if (queryTab === "backup" || queryTab === "backups") {
                setActiveTab("backups");
            } else if (queryTab === "migration") {
                setActiveTab("migration");
            } else if (queryTab === "engines") {
                setActiveTab("engines");
            }
        }
    }, [queryTab]);

    const handleRefreshAll = () => {
        if (activeTab === "backups") {
            loadBackups();
        } else {
            handleDbRefresh();
        }
    };

    const activeToast = dbToast || backupToast;
    const closeToast = () => {
        setBackupToast(null);
    };

    const targetEngineForCutover = activeMigrationJob?.targetEngine || (form.engine === "postgres" ? "mssql" : "postgres");

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-cud-teal-bg border border-cud-teal-border text-cud-teal">
                        <Database className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            Adattárház & Katasztrófa-helyreállítás
                        </h1>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Magas rendelkezésre állású (HA) relációs klaszterek, Zero-Downtime migráció és S3 mentések.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <SegmentedControl<DatabaseSubTab>
                        value={activeTab}
                        onChange={handleTabChange}
                        options={DATABASE_TAB_OPTIONS}
                        layout="pill"
                    />

                    <Button
                        variant="secondary"
                        size="md"
                        loading={isDbRefreshing || isBackupLoading}
                        icon={<RefreshCw className="w-4 h-4" />}
                        onClick={handleRefreshAll}
                    >
                        Frissítés
                    </Button>
                </div>
            </div>

            {activeTab !== "backups" && (
                <DatabaseMetricCards overview={overview} isLoading={isDbLoading} />
            )}

            {activeTab === "engines" && (
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
                    </div>
                </div>
            )}

            {activeTab === "migration" && (
                <div className="flex flex-col gap-6">
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
            )}

            {activeTab === "backups" && (
                <div className="flex flex-col gap-6">
                    <BackupStats
                        totalCount={history?.totalCount ?? 0}
                        latestBackup={history?.latestBackup}
                        syncedCount={syncedCount}
                    />

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <SearchInput
                            value={backupSearch}
                            onChange={setBackupSearch}
                            placeholder="Mentési archívum keresése név alapján..."
                            className="w-full sm:w-80"
                        />

                        <Button
                            variant="primary"
                            size="md"
                            loading={isTriggeringBackup}
                            icon={<Play className="w-4 h-4 fill-current" />}
                            onClick={handleTriggerBackup}
                        >
                            Azonnali mentés indítása
                        </Button>
                    </div>

                    <BackupTable
                        backups={history?.backups || []}
                        isLoading={isBackupLoading}
                        searchQuery={backupSearch}
                        onSelectRestore={handleOpenRestore}
                    />

                    {isRestoreModalOpen && selectedRestore && (
                        <RestoreModal
                            isOpen={isRestoreModalOpen}
                            backup={selectedRestore}
                            isLoading={isRestoring}
                            onClose={handleCloseRestoreModal}
                            onConfirm={handleConfirmRestore}
                        />
                    )}
                </div>
            )}

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

            {activeToast && (
                <div
                    className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium animate-in slide-in-from-bottom-3 duration-200 ${
                        activeToast.type === "success"
                            ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
                            : "bg-rose-950/90 border-rose-500/50 text-rose-200"
                    }`}
                >
                    {activeToast.type === "success" ? (
                        <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                    ) : (
                        <XCircle className="w-5 h-5 shrink-0 text-rose-400" />
                    )}
                    <span>{activeToast.text}</span>
                    <button
                        type="button"
                        onClick={closeToast}
                        className="ml-2 text-xs opacity-60 hover:opacity-100 transition-all cursor-pointer p-0.5"
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
    );
};
