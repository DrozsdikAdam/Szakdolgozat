import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import type {
    DatabaseOverviewDto,
    DatabaseEngine,
    DatabaseMode,
    DatabaseFormData,
    TestConnectionResultDto,
    MigrationJobStatusDto,
    CutoverStatusDto
} from "../types/database";
import type { ToastMessage } from "../types/component/common";
import { DatabaseApi } from "../client/api/database";
import {
    DEFAULT_DB_PORTS,
    DEFAULT_INTERNAL_HOSTS,
    INITIAL_DATABASE_FORM
} from "../constants/database";

export type { DatabaseFormData };

export const useDatabase = () => {
    const [overview, setOverview] = useState<DatabaseOverviewDto | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);

    const [form, setForm] = useState<DatabaseFormData>(INITIAL_DATABASE_FORM);
    const [isFormDirty, setIsFormDirty] = useState<boolean>(false);

    const [isPinging, setIsPinging] = useState<boolean>(false);
    const [pingResult, setPingResult] = useState<TestConnectionResultDto | null>(null);

    const [isScaling, setIsScaling] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);

    const [isMigrating, setIsMigrating] = useState<boolean>(false);
    const [activeMigrationJob, setActiveMigrationJob] = useState<MigrationJobStatusDto | null>(null);

    const [cutoverStatus, setCutoverStatus] = useState<CutoverStatusDto | null>(null);
    const [isSchedulingCutover, setIsSchedulingCutover] = useState<boolean>(false);
    const [isCancellingCutover, setIsCancellingCutover] = useState<boolean>(false);
    const [isCutoverModalOpen, setIsCutoverModalOpen] = useState<boolean>(false);

    const api = useMemo(() => new DatabaseApi(), []);
    const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const showToast = useCallback((text: string, type: "success" | "error" = "success") => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage(null), 4000);
    }, []);

    const loadData = useCallback(async (showLoading = false) => {
        try {
            if (showLoading) setIsLoading(true);
            const [overviewData, cutoverData] = await Promise.all([
                api.getOverview().catch(() => null),
                api.getCutoverStatus().catch(() => null)
            ]);

            if (overviewData) {
                setOverview(overviewData);
                if (!isFormDirty) {
                    setForm({
                        engine: overviewData.engine,
                        mode: overviewData.mode,
                        host: overviewData.host,
                        port: overviewData.port,
                        database: overviewData.database,
                        username: overviewData.username,
                        password: "",
                        replicas: overviewData.replicas,
                        poolSize: overviewData.poolSize,
                        restartWorkload: true
                    });
                }
            }

            if (cutoverData) {
                setCutoverStatus(cutoverData);
            }
        } catch {
            showToast("Nem sikerült betölteni az adatbázis konfigurációt.", "error");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [api, isFormDirty, showToast]);

    useEffect(() => {
        loadData(true);
    }, [loadData]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadData(false);
        showToast("Adatbázis állapot frissítve!");
    };

    const handleEngineChange = (engine: DatabaseEngine) => {
        setIsFormDirty(true);
        setForm(prev => ({
            ...prev,
            engine,
            port: DEFAULT_DB_PORTS[engine],
            host: prev.mode === 'internal' ? DEFAULT_INTERNAL_HOSTS[engine] : prev.host
        }));
    };

    const handleModeChange = (mode: DatabaseMode) => {
        setIsFormDirty(true);
        setForm(prev => ({
            ...prev,
            mode,
            host: mode === 'internal' ? DEFAULT_INTERNAL_HOSTS[prev.engine] : 'localhost'
        }));
    };

    const handleFieldChange = (field: keyof DatabaseFormData, value: any) => {
        setIsFormDirty(true);
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleTestConnection = async () => {
        try {
            setIsPinging(true);
            setPingResult(null);

            const result = await api.testConnection({
                engine: form.engine,
                mode: form.mode,
                host: form.host,
                port: Number(form.port),
                database: form.database,
                username: form.username,
                password: form.password || undefined
            });

            setPingResult(result);
            if (result.success) {
                showToast(`Sikeres kapcsolat: ${result.latencyMs} ms (${result.message})`, "success");
            } else {
                showToast(`Kapcsolódási hiba: ${result.message}`, "error");
            }
        } catch (err: any) {
            const errorMsg = err?.message || "Hiba a kapcsolatteszt során.";
            setPingResult({
                success: false,
                latencyMs: 0,
                message: errorMsg
            });
            showToast(errorMsg, "error");
        } finally {
            setIsPinging(false);
        }
    };

    const handleScale = async (newReplicas: number, newPoolSize?: number) => {
        try {
            setIsScaling(true);
            const clamped = Math.max(1, Math.min(5, newReplicas));
            const result = await api.scaleDatabase({
                engine: overview?.engine || form.engine,
                replicas: clamped,
                poolSize: newPoolSize ?? form.poolSize
            });

            setOverview(prev => prev ? { ...prev, replicas: result.replicas } : null);
            setForm(prev => ({ ...prev, replicas: result.replicas }));
            showToast(result.message || `Adatbázis skálázva ${result.replicas} példányra.`, "success");
        } catch (err: any) {
            showToast(err?.message || "Hiba az adatbázis skálázása során.", "error");
        } finally {
            setIsScaling(false);
        }
    };

    const handleSaveConfig = async () => {
        try {
            setIsSaving(true);
            const result = await api.saveConfig({
                engine: form.engine,
                mode: form.mode,
                host: form.host,
                port: Number(form.port),
                database: form.database,
                username: form.username,
                password: form.password || undefined,
                replicas: form.replicas,
                poolSize: form.poolSize,
                restartWorkload: form.restartWorkload
            });

            setIsFormDirty(false);
            showToast(result.message || "Adatbázis konfiguráció sikeresen elmentve!", "success");
            await loadData(false);
        } catch (err: any) {
            showToast(err?.message || "Nem sikerült elmenteni a konfigurációt.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleStartMigration = async (targetEngine: DatabaseEngine) => {
        try {
            setIsMigrating(true);
            const sourceEngine = overview?.engine || form.engine;

            const job = await api.startMigration({
                sourceEngine,
                targetEngine,
                targetConfig: {
                    engine: targetEngine,
                    mode: form.mode,
                    host: form.mode === 'internal' ? DEFAULT_INTERNAL_HOSTS[targetEngine] : form.host,
                    port: DEFAULT_DB_PORTS[targetEngine],
                    database: form.database,
                    username: form.username,
                    password: form.password || undefined
                }
            });

            setActiveMigrationJob(job);
            showToast(`Migrációs folyamat elindítva: ${sourceEngine.toUpperCase()} -> ${targetEngine.toUpperCase()}`, "success");
        } catch (err: any) {
            showToast(err?.message || "Hiba a migráció indításakor.", "error");
            setIsMigrating(false);
        }
    };

    useEffect(() => {
        if (!activeMigrationJob) {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
            return;
        }

        const isTerminal = activeMigrationJob.status === 'COMPLETED' || activeMigrationJob.status === 'FAILED';
        if (isTerminal) {
            setIsMigrating(false);
            if (activeMigrationJob.status === 'COMPLETED') {
                showToast("Adatbázis migráció sikeresen befejeződött!", "success");
                loadData(false);
            } else {
                showToast(`Migrációs hiba: ${activeMigrationJob.errorMessage || 'Ismeretlen hiba'}`, "error");
            }
            return;
        }

        pollingIntervalRef.current = setInterval(async () => {
            try {
                const status = await api.getMigrationStatus(activeMigrationJob.jobId);
                if (status) {
                    setActiveMigrationJob(status);
                }
            } catch {
                // csendes hiba polling közben
            }
        }, 1000);

        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, [activeMigrationJob, api, loadData, showToast]);

    const handleScheduleCutover = async (params: {
        scheduledAt: string;
        targetEngine: DatabaseEngine;
        enableMaintenanceMode: boolean;
        restartBackend: boolean;
    }) => {
        try {
            setIsSchedulingCutover(true);
            const result = await api.scheduleCutover({
                targetEngine: params.targetEngine,
                targetConfig: {
                    engine: params.targetEngine,
                    mode: form.mode,
                    host: form.mode === 'internal' ? DEFAULT_INTERNAL_HOSTS[params.targetEngine] : form.host,
                    port: DEFAULT_DB_PORTS[params.targetEngine],
                    database: form.database,
                    username: form.username,
                    password: form.password || undefined
                },
                scheduledAt: params.scheduledAt,
                enableMaintenanceMode: params.enableMaintenanceMode,
                restartBackend: params.restartBackend
            });

            setCutoverStatus(result);
            setIsCutoverModalOpen(false);
            showToast(result.message || "Átállási ablak sikeresen ütemezve!", "success");
            await loadData(false);
        } catch (err: any) {
            showToast(err?.message || "Nem sikerült beütemezni az átállást.", "error");
        } finally {
            setIsSchedulingCutover(false);
        }
    };

    const handleCancelCutover = async () => {
        try {
            setIsCancellingCutover(true);
            const result = await api.cancelCutover();
            setCutoverStatus(result);
            showToast(result.message || "Időzített átállás visszavonva.", "success");
        } catch (err: any) {
            showToast(err?.message || "Nem sikerült visszavonni az átállást.", "error");
        } finally {
            setIsCancellingCutover(false);
        }
    };

    return {
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
        loadData,
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
    };
};
