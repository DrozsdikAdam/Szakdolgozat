import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useDatabase } from "../hooks/useDatabase";
import { useBackupHistory } from "../hooks/useBackupHistory";
import { useStorage } from "../hooks/useStorage";
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
import {
    StorageMetricCards,
    StorageModeSelectorCard,
    InternalStorageCard,
    ExternalStorageCard
} from "../components/dashboard/storage";
import { BackupStats } from "../components/dashboard/backup/Stats";
import { BackupTable } from "../components/dashboard/backup/Table";
import { RestoreModal } from "../components/dashboard/backup/RestoreModal";
import { SearchInput } from "../components/common/SearchInput";
import { SegmentedControl } from "../components/common/SegmentedControl";
import { Button } from "../components/common/Button";
import { Toggle } from "../components/common/Toggle";
import { useFeatureFlags } from "../hooks/useFeatureFlags";
import { CheckCircle2, Database, Play, RefreshCw, XCircle, Archive, Server } from "lucide-react";

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

    const {
        overview: storageOverview,
        isLoading: isStorageLoading,
        isRefreshing: isStorageRefreshing,
        toastMessage: storageToast,
        form: storageForm,
        isFormDirty: isStorageDirty,
        isTesting: isStorageTesting,
        testResult: storageTestResult,
        isSaving: isStorageSaving,
        handleRefresh: handleStorageRefresh,
        handleModeChange: handleStorageModeChange,
        handleSizeChange: handleStorageSizeChange,
        handleFieldChange: handleStorageFieldChange,
        handleTestConnection: handleStorageTestConnection,
        handleSaveConfig: handleStorageSaveConfig
    } = useStorage();

    const {
        flags,
        handleToggle: handleFeatureToggle,
        isCardToggling: isFeatureToggling
    } = useFeatureFlags();

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
            } else if (queryTab === "storage") {
                setActiveTab("storage");
            } else if (queryTab === "engines") {
                setActiveTab("engines");
            }
        }
    }, [queryTab]);

    const handleRefreshAll = () => {
        if (activeTab === "backups") {
            loadBackups();
        } else if (activeTab === "storage") {
            handleStorageRefresh();
        } else {
            handleDbRefresh();
        }
    };

    const activeToast = dbToast || backupToast || storageToast;
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
                        loading={isDbRefreshing || isBackupLoading || isStorageRefreshing}
                        icon={<RefreshCw className="w-4 h-4" />}
                        onClick={handleRefreshAll}
                    >
                        Frissítés
                    </Button>
                </div>
            </div>

            {(activeTab === "engines" || activeTab === "migration") && (
                <DatabaseMetricCards overview={overview} isLoading={isDbLoading} />
            )}

            {activeTab === "storage" && (
                <StorageMetricCards overview={storageOverview} isLoading={isStorageLoading} />
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
                            engine={form.engine}
                            pgbouncerEnabled={Boolean(flags.pgbouncer)}
                            onTogglePgbouncer={(next) => handleFeatureToggle("pgbouncer", next)}
                            haproxyEnabled={Boolean(flags.haproxy)}
                            onToggleHaproxy={(next) => handleFeatureToggle("haproxy", next)}
                            isProxyToggling={isFeatureToggling("pgbouncer") || isFeatureToggling("haproxy")}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl border ${flags.backup_storage ? 'bg-cud-orange/10 border-cud-orange/30 text-cud-orange' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                                    <Server className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-semibold text-slate-100">Mentési Tárhely Célállomás</h3>
                                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${flags.backup_storage ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                                            {flags.backup_storage ? "Bekapcsolva" : "Kikapcsolva"}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Adatbázis snapshotok és dumpok tárolási modulja.
                                    </p>
                                </div>
                            </div>
                            <Toggle
                                checked={Boolean(flags.backup_storage)}
                                loading={isFeatureToggling("backup_storage")}
                                onChange={(next) => handleFeatureToggle("backup_storage", next)}
                                ariaLabel="Mentési Tárhely Ki/Be kapcsolása"
                            />
                        </div>

                        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl border ${flags.cronjob_backup ? 'bg-cud-teal/10 border-cud-teal/30 text-cud-teal' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                                    <Archive className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-semibold text-slate-100">Automatikus Mentési CronJob</h3>
                                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${flags.cronjob_backup ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                                            {flags.cronjob_backup ? "Ütemezve (02:00)" : "Felfüggesztve"}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Ütemezett éjszakai adatbázis mentési feladat.
                                    </p>
                                </div>
                            </div>
                            <Toggle
                                checked={Boolean(flags.cronjob_backup)}
                                loading={isFeatureToggling("cronjob_backup")}
                                onChange={(next) => handleFeatureToggle("cronjob_backup", next)}
                                ariaLabel="CronJob Mentés Ki/Be kapcsolása"
                            />
                        </div>
                    </div>

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

            {activeTab === "storage" && (
                <div className="flex flex-col gap-6">
                    <StorageModeSelectorCard
                        selectedMode={storageForm.mode}
                        onModeChange={handleStorageModeChange}
                        disabled={isStorageSaving || isStorageTesting}
                        appStorageEnabled={Boolean(flags.app_storage)}
                        onToggleAppStorage={(next) => handleFeatureToggle("app_storage", next)}
                        isToggling={isFeatureToggling("app_storage")}
                    />

                    {storageForm.mode === "internal" ? (
                        <InternalStorageCard
                            overview={storageOverview}
                            internalSizeGb={storageForm.internalSizeGb}
                            isDirty={isStorageDirty}
                            isSaving={isStorageSaving}
                            isTesting={isStorageTesting}
                            testResult={storageTestResult}
                            onSizeChange={handleStorageSizeChange}
                            onSave={handleStorageSaveConfig}
                            onTestConnection={handleStorageTestConnection}
                            disabled={isStorageSaving}
                        />
                    ) : (
                        <ExternalStorageCard
                            formData={storageForm}
                            isDirty={isStorageDirty}
                            isSaving={isStorageSaving}
                            isTesting={isStorageTesting}
                            testResult={storageTestResult}
                            onFieldChange={handleStorageFieldChange}
                            onSave={handleStorageSaveConfig}
                            onTestConnection={handleStorageTestConnection}
                            disabled={isStorageSaving}
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
