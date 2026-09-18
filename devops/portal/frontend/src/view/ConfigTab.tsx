import { useState, useEffect, useMemo, useCallback } from "react";
import { FileText, Lock, Plus, RefreshCw, KeyRound, CheckCircle2, AlertCircle } from "lucide-react";
import { ConfigApi } from "../client/api/config";
import type { ConfigMapDto, SecretDto, SaveConfigDto, ConfigViewType } from "../types/config";
import type { SegmentedControlOption } from "../types/component/common/segmentedControlProps";
import { SegmentedControl } from "../components/common/SegmentedControl";
import { Select } from "../components/common/Select";
import { SearchInput } from "../components/common/SearchInput";
import { Button } from "../components/common/Button";
import { EmptyState } from "../components/common/EmptyState";
import { ConfigCard } from "../components/dashboard/config/ConfigCard";
import { ConfigEditorModal } from "../components/dashboard/config/ConfigEditorModal";
import { RestartConfirmModal } from "../components/dashboard/config/RestartConfirmModal";
import { DeleteConfirmModal } from "../components/dashboard/config/DeleteConfirmModal";

export const ConfigTab = () => {
    const [viewType, setViewType] = useState<ConfigViewType>("configmaps");
    const [namespace, setNamespace] = useState<string>("all");
    const [search, setSearch] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);

    const [configMaps, setConfigMaps] = useState<ConfigMapDto[]>([]);
    const [secrets, setSecrets] = useState<SecretDto[]>([]);
    const [revealedSecrets, setRevealedSecrets] = useState<Record<string, Record<string, string>>>({});
    const [revealingKey, setRevealingKey] = useState<string | null>(null);

    // Modal states
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ConfigMapDto | SecretDto | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<ConfigMapDto | SecretDto | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [restartTarget, setRestartTarget] = useState<{ namespace: string; workloadNames: string[] } | null>(null);
    const [isRestarting, setIsRestarting] = useState(false);

    // Notification feedback
    const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

    const configApi = useMemo(() => new ConfigApi(), []);

    const showToast = (text: string, type: "success" | "error" = "success") => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage(null), 4000);
    };

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
    }, [configApi, namespace]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRevealToggle = async (sec: SecretDto) => {
        const id = `${sec.namespace}/${sec.name}`;
        if (revealedSecrets[id]) {
            // Already revealed, hide it
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

    // Filter list
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

    const viewTypeOptions: SegmentedControlOption<ConfigViewType>[] = [
        {
            id: "configmaps",
            label: "ConfigMaps (Változók)",
            icon: <FileText className="w-3.5 h-3.5 text-cud-teal" />,
            count: configMaps.length,
            variant: "teal",
        },
        {
            id: "secrets",
            label: "Secrets (Titkok & Jelszavak)",
            icon: <Lock className="w-3.5 h-3.5 text-cud-purple" />,
            count: secrets.length,
            variant: "purple",
        },
    ];

    const namespaceOptions = [
        { value: "all", label: "Összes névtér" },
        { value: "platform-infra", label: "platform-infra" },
        { value: "app-mes", label: "app-mes" },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2.5">
                        <KeyRound className="w-6 h-6 text-cud-teal" />
                        <span>Környezeti Változók & Titkok Kezelője</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                        Kubernetes ConfigMaps és Secrets böngészése, valós idejű szerkesztése és workload újraindítások vezérlése.
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Button
                        variant="secondary"
                        size="md"
                        icon={<RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />}
                        onClick={loadData}
                        disabled={loading}
                    >
                        Frissítés
                    </Button>

                    <Button
                        variant="primary"
                        size="md"
                        icon={<Plus className="w-4 h-4" />}
                        onClick={handleOpenCreate}
                    >
                        {viewType === "secrets" ? "Új Secret" : "Új ConfigMap"}
                    </Button>
                </div>
            </div>

            {/* Notification Toast */}
            {toastMessage && (
                <div
                    className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs transition-all ${
                        toastMessage.type === "success"
                            ? "bg-cud-teal-bg text-cud-teal border-cud-teal-border"
                            : "bg-cud-vermillon-bg text-cud-vermillon border-cud-vermillon-border"
                    }`}
                >
                    {toastMessage.type === "success" ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                        <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span className="font-medium">{toastMessage.text}</span>
                </div>
            )}

            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <SegmentedControl
                    value={viewType}
                    onChange={(val) => setViewType(val as ConfigViewType)}
                    options={viewTypeOptions}
                    size="sm"
                    layout="pill"
                />

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 md:justify-end">
                    <Select
                        value={namespace}
                        onChange={(val) => setNamespace(String(val))}
                        options={namespaceOptions}
                        size="sm"
                        className="w-full sm:w-44"
                        title="Szűrés Kubernetes névtér szerint"
                    />

                    <SearchInput
                        value={search}
                        onChange={setSearch}
                        placeholder={
                            viewType === "secrets"
                                ? "Keresés titok neve vagy kulcsa szerint..."
                                : "Keresés ConfigMap neve vagy kulcsa szerint..."
                        }
                        className="w-full sm:w-64 md:w-80"
                    />
                </div>
            </div>

            {/* Cards Grid */}
            {loading && currentList.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                    <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-cud-skyblue" />
                    <p className="text-sm">Konfigurációk betöltése a Kubernetes klaszterből...</p>
                </div>
            ) : filteredItems.length === 0 ? (
                <EmptyState
                    icon={viewType === "secrets" ? <Lock className="w-8 h-8 text-slate-500" /> : <FileText className="w-8 h-8 text-slate-500" />}
                    title={
                        search
                            ? "Nincs találat a keresési feltételekre"
                            : viewType === "secrets"
                            ? "Nem található Secret ebben a névtérben"
                            : "Nem található ConfigMap ebben a névtérben"
                    }
                    description={
                        search
                            ? `Nincs olyan elem, amely illeszkedne a(z) '${search}' kifejezésre.`
                            : "Hozz létre egy új konfigurációt a fenti gombra kattintva."
                    }
                    action={
                        <Button
                            variant="primary"
                            size="sm"
                            icon={<Plus className="w-3.5 h-3.5" />}
                            onClick={handleOpenCreate}
                        >
                            {viewType === "secrets" ? "Új Secret létrehozása" : "Új ConfigMap létrehozása"}
                        </Button>
                    }
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredItems.map((item) => {
                        const isSec = viewType === "secrets";
                        const id = `${item.namespace}/${item.name}`;

                        return (
                            <ConfigCard
                                key={id}
                                item={item}
                                isSecret={isSec}
                                revealedData={isSec ? revealedSecrets[id] : undefined}
                                isRevealing={revealingKey === id}
                                onRevealToggle={isSec ? handleRevealToggle : undefined}
                                onEdit={handleOpenEdit}
                                onDelete={(target) => setDeleteTarget(target)}
                                onRestartWorkload={(ns, wls) =>
                                    setRestartTarget({ namespace: ns, workloadNames: wls })
                                }
                            />
                        );
                    })}
                </div>
            )}

            {/* Editor Modal */}
            <ConfigEditorModal
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                onSave={handleSave}
                isSecret={viewType === "secrets"}
                initialData={editingItem}
                currentNamespace={namespace}
                isSaving={isSaving}
            />

            {/* Restart Workloads Confirmation Modal */}
            {restartTarget && (
                <RestartConfirmModal
                    isOpen={Boolean(restartTarget)}
                    onClose={() => setRestartTarget(null)}
                    onConfirm={handleRestartConfirm}
                    namespace={restartTarget.namespace}
                    workloadNames={restartTarget.workloadNames}
                    isRestarting={isRestarting}
                />
            )}

            {/* Delete Resource Confirmation Modal */}
            {deleteTarget && (
                <DeleteConfirmModal
                    isOpen={Boolean(deleteTarget)}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                    name={deleteTarget.name}
                    namespace={deleteTarget.namespace}
                    isSecret={viewType === "secrets"}
                    isDeleting={isDeleting}
                />
            )}
        </div>
    );
};
