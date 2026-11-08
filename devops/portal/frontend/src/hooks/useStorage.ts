import { useEffect, useMemo, useState, useCallback } from "react";
import type {
    StorageOverViewDto,
    StorageMode,
    StorageFormData,
    StorageTestResponseDto,
    StorageConfigUpdateDto
} from "../types/storage";
import type { ToastMessage } from "../types/component/common";
import { StorageApi } from "../client/api/storage";
import { INITIAL_STORAGE_FORM } from "../constants/storage";

export const useStorage = () => {
    const [overview, setOverview] = useState<StorageOverViewDto | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);

    const [form, setForm] = useState<StorageFormData>(INITIAL_STORAGE_FORM);
    const [isFormDirty, setIsFormDirty] = useState<boolean>(false);

    const [isTesting, setIsTesting] = useState<boolean>(false);
    const [testResult, setTestResult] = useState<StorageTestResponseDto | null>(null);
    const [isSaving, setIsSaving] = useState<boolean>(false);

    const api = useMemo(() => new StorageApi(), []);

    const showToast = useCallback((text: string, type: "success" | "error" = "success") => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage(null), 4000);
    }, []);

    const loadData = useCallback(async (showLoading = false) => {
        try {
            if (showLoading) setIsLoading(true);
            const overviewData = await api.getOverview().catch(() => null);

            if (overviewData) {
                setOverview(overviewData);
                setForm({
                    mode: overviewData.mode,
                    internalSizeGb: overviewData.internal.allocatedSizeGb || 5,
                    externalEndpoint: overviewData.external.endpoint || "",
                    externalBucket: overviewData.external.bucketName || "",
                    externalRegion: overviewData.external.region || "us-east-1",
                    externalAccessKey: overviewData.external.accessKeyMasked || "",
                    externalSecretKey: "",
                    scaleDownInternal: overviewData.internal.replicas === 0
                });
                setIsFormDirty(false);
            }
        } catch (err: any) {
            showToast(err.message || "Nem sikerült betölteni a tárhely állapotot", "error");
        } finally {
            if (showLoading) setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [api, showToast]);

    useEffect(() => {
        loadData(true);
    }, [loadData]);

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        loadData(false);
    }, [loadData]);

    const handleModeChange = useCallback((mode: StorageMode) => {
        setForm(prev => ({ ...prev, mode }));
        setIsFormDirty(true);
    }, []);

    const handleSizeChange = useCallback((internalSizeGb: number) => {
        setForm(prev => ({ ...prev, internalSizeGb }));
        setIsFormDirty(true);
    }, []);

    const handleFieldChange = useCallback((field: keyof StorageFormData, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
        setIsFormDirty(true);
    }, []);

    const handleTestConnection = useCallback(async () => {
        try {
            setIsTesting(true);
            setTestResult(null);

            const result = await api.testConnection({
                mode: form.mode,
                endpoint: form.externalEndpoint,
                bucket: form.externalBucket,
                accessKey: form.externalAccessKey,
                secretKey: form.externalSecretKey
            });

            setTestResult(result);
            showToast(result.message, result.success ? "success" : "error");
        } catch (err: any) {
            const failResult: StorageTestResponseDto = {
                success: false,
                message: err.message || "Hiba a kapcsolatteszt során",
                responseTimeMs: 0
            };
            setTestResult(failResult);
            showToast(failResult.message, "error");
        } finally {
            setIsTesting(false);
        }
    }, [api, form, showToast]);

    const handleSaveConfig = useCallback(async () => {
        try {
            setIsSaving(true);

            const updateDto: StorageConfigUpdateDto = {
                mode: form.mode,
                internalSizeGb: form.mode === "internal" ? form.internalSizeGb : undefined,
                externalEndpoint: form.mode === "external" ? form.externalEndpoint : undefined,
                externalBucket: form.mode === "external" ? form.externalBucket : undefined,
                externalRegion: form.mode === "external" ? form.externalRegion : undefined,
                externalAccessKey: form.mode === "external" && form.externalAccessKey ? form.externalAccessKey : undefined,
                externalSecretKey: form.mode === "external" && form.externalSecretKey ? form.externalSecretKey : undefined,
                scaleDownInternal: form.mode === "external" ? form.scaleDownInternal : false
            };

            const result = await api.saveConfig(updateDto);
            showToast(result.message || "Beállítások sikeresen elmentve", "success");
            setIsFormDirty(false);
            await loadData(false);
        } catch (err: any) {
            showToast(err.message || "Nem sikerült a beállítások mentése", "error");
        } finally {
            setIsSaving(false);
        }
    }, [api, form, loadData, showToast]);

    return {
        overview,
        isLoading,
        isRefreshing,
        toastMessage,
        form,
        isFormDirty,
        isTesting,
        testResult,
        isSaving,
        handleRefresh,
        handleModeChange,
        handleSizeChange,
        handleFieldChange,
        handleTestConnection,
        handleSaveConfig
    };
};
