import { useState, useEffect, useMemo, useCallback } from "react";
import { ConfigApi } from "../client/api/config";
import type { ConfigMapDto, SecretDto, SaveConfigDto, ConfigViewType } from "../types/config";
import type { ToastMessage } from "../types/component/common";

export const useClusterConfigs = () => {
    const [viewType, setViewType] = useState<ConfigViewType>("configmaps");
    const [namespace, setNamespace] = useState<string>("all");
    const [search, setSearch] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);

    const [configMaps, setConfigMaps] = useState<ConfigMapDto[]>([]);
    const [secrets, setSecrets] = useState<SecretDto[]>([]);
    const [revealedSecrets, setRevealedSecrets] = useState<Record<string, Record<string, string>>>({});
    const [revealingKey, setRevealingKey] = useState<string | null>(null);

    // Modal states
    const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
    const [editingItem, setEditingItem] = useState<ConfigMapDto | SecretDto | null>(null);
    const [isSaving, setIsSaving] = useState<boolean>(false);

    const [deleteTarget, setDeleteTarget] = useState<ConfigMapDto | SecretDto | null>(null);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    const [restartTarget, setRestartTarget] = useState<{ namespace: string; workloadNames: string[] } | null>(null);
    const [isRestarting, setIsRestarting] = useState<boolean>(false);

    // Toast feedback
    const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);

    const configApi = useMemo(() => new ConfigApi(), []);

    const showToast = useCallback((text: string, type: "success" | "error" = "success") => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage(null), 4000);
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [cmList, secList] = await Promise.all([
                configApi.getConfigMaps(namespace),
                configApi.getSecrets(namespace),
            ]);
            setConfigMaps(cmList || []);
            setSecrets(secList || []);
        } catch (err) {
            console.error("Nem sikerült betölteni a konfigurációkat:", err);
            showToast("Nem sikerült lekérni a konfigurációkat a klaszterből.", "error");
        } finally {
            setLoading(false);
        }
    }, [configApi, namespace, showToast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRevealToggle = async (sec: SecretDto) => {
        const id = `${sec.namespace}/${sec.name}`;
        if (revealedSecrets[id]) {
            setRevealedSecrets((prev) => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
            return;
        }

        setRevealingKey(id);
        try {
            const res = await configApi.revealSecret(sec.namespace, sec.name);
            setRevealedSecrets((prev) => ({
                ...prev,
                [id]: res.data || {},
            }));
            showToast(`Secret '${sec.name}' feloldva megtekintésre.`);
        } catch (err) {
            console.error("Hiba a titok feloldásakor:", err);
            showToast("Nem sikerült feloldani a titkot.", "error");
        } finally {
            setRevealingKey(null);
        }
    };

    const handleOpenCreate = () => {
        setEditingItem(null);
        setIsEditorOpen(true);
    };

    const handleOpenEdit = (item: ConfigMapDto | SecretDto) => {
        setEditingItem(item);
        setIsEditorOpen(true);
    };

    const handleSave = async (payload: SaveConfigDto, isSec: boolean) => {
        setIsSaving(true);
        try {
            if (isSec) {
                await configApi.saveSecret(payload);
                showToast(`Secret '${payload.name}' sikeresen elmentve.`);
            } else {
                await configApi.saveConfigMap(payload);
                showToast(`ConfigMap '${payload.name}' sikeresen elmentve.`);
            }
            await loadData();
        } catch (err) {
            throw err;
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            if (viewType === "secrets") {
                await configApi.deleteSecret(deleteTarget.namespace, deleteTarget.name);
                showToast(`Secret '${deleteTarget.name}' sikeresen törölve.`);
            } else {
                await configApi.deleteConfigMap(deleteTarget.namespace, deleteTarget.name);
                showToast(`ConfigMap '${deleteTarget.name}' sikeresen törölve.`);
            }
            setDeleteTarget(null);
            await loadData();
        } catch (err) {
            console.error("Törlési hiba:", err);
            showToast("Nem sikerült törölni az erőforrást.", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleRestartConfirm = async () => {
        if (!restartTarget) return;
        setIsRestarting(true);
        try {
            const res = await configApi.restartWorkloads(
                restartTarget.namespace,
                restartTarget.workloadNames
            );
            showToast(res.message || "Workloadok sikeresen újraindítva.");
            setRestartTarget(null);
            await loadData();
        } catch (err) {
            console.error("Újraindítási hiba:", err);
            showToast("Nem sikerült újraindítani a workloadokat.", "error");
        } finally {
            setIsRestarting(false);
        }
    };

    const currentList = viewType === "configmaps" ? configMaps : secrets;

    const filteredItems = useMemo(() => {
        return currentList.filter((item) => {
            const matchesNamespace =
                namespace === "all" || item.namespace === namespace;

            if (!matchesNamespace) return false;

            if (!search.trim()) return true;

            const q = search.toLowerCase().trim();
            const matchesName = item.name.toLowerCase().includes(q);
            const matchesKeys = Object.keys(item.data || {}).some((k) =>
                k.toLowerCase().includes(q)
            );

            return matchesName || matchesKeys;
        });
    }, [currentList, namespace, search]);

    return {
        viewType,
        setViewType,
        namespace,
        setNamespace,
        search,
        setSearch,
        loading,
        configMaps,
        secrets,
        revealedSecrets,
        revealingKey,
        isEditorOpen,
        setIsEditorOpen,
        editingItem,
        isSaving,
        deleteTarget,
        setDeleteTarget,
        isDeleting,
        restartTarget,
        setRestartTarget,
        isRestarting,
        toastMessage,
        setToastMessage,
        loadData,
        handleRevealToggle,
        handleOpenCreate,
        handleOpenEdit,
        handleSave,
        handleDelete,
        handleRestartConfirm,
        filteredItems
    };
};
