import { FileText, Lock, Plus, RefreshCw, KeyRound, CheckCircle2, AlertCircle } from "lucide-react";
import { useClusterConfigs } from "../hooks/useClusterConfigs";
import type { ConfigViewType } from "../types/config";
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
    const {
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
    } = useClusterConfigs();

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

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
                        <KeyRound className="w-6 h-6 text-cud-teal" />
                        Klaszter Konfigurációk & Titkok
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                        Kubernetes ConfigMaps és Secrets böngészése, titkosított adatok feloldása és workload újraindítások.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <Button
                        variant="secondary"
                        size="sm"
                        loading={loading}
                        icon={<RefreshCw className="w-4 h-4" />}
                        onClick={loadData}
                    >
                        Frissítés
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        icon={<Plus className="w-4 h-4" />}
                        onClick={handleOpenCreate}
                    >
                        Új {viewType === "configmaps" ? "ConfigMap" : "Secret"}
                    </Button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="w-full md:w-auto">
                    <SegmentedControl<ConfigViewType>
                        value={viewType}
                        onChange={setViewType}
                        options={viewTypeOptions}
                    />
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="w-full sm:w-48">
                        <Select<string>
                            value={namespace}
                            onChange={(val) => setNamespace(String(val))}
                            options={[
                                { label: "Összes névtér", value: "all" },
                                { label: "app-mes", value: "app-mes" },
                                { label: "platform-infra", value: "platform-infra" },
                                { label: "default", value: "default" },
                            ]}
                        />
                    </div>
                    <SearchInput
                        value={search}
                        onChange={setSearch}
                        placeholder="Keresés név vagy kulcs alapján..."
                        className="w-full sm:w-64"
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-48 rounded-xl bg-slate-900/40 border border-slate-800/80 animate-pulse"
                        />
                    ))}
                </div>
            ) : filteredItems.length === 0 ? (
                <EmptyState
                    icon={
                        viewType === "configmaps" ? (
                            <FileText className="w-8 h-8 text-slate-500" />
                        ) : (
                            <Lock className="w-8 h-8 text-slate-500" />
                        )
                    }
                    title={`Nem található ${viewType === "configmaps" ? "ConfigMap" : "Secret"}`}
                    description={
                        search
                            ? "Nincs a keresési feltételeknek megfelelő elem."
                            : "Ebben a névtérben még nem található konfigurációs erőforrás."
                    }
                    action={
                        <Button
                            variant="secondary"
                            size="sm"
                            icon={<Plus className="w-4 h-4" />}
                            onClick={handleOpenCreate}
                        >
                            Létrehozás most
                        </Button>
                    }
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredItems.map((item) => {
                        const id = `${item.namespace}/${item.name}`;
                        return (
                            <ConfigCard
                                key={id}
                                item={item}
                                isSecret={viewType === "secrets"}
                                revealedData={revealedSecrets[id]}
                                isRevealing={revealingKey === id}
                                onRevealToggle={() => handleRevealToggle(item as any)}
                                onEdit={() => handleOpenEdit(item)}
                                onDelete={() => setDeleteTarget(item)}
                                onRestartWorkload={(ns, wls) =>
                                    setRestartTarget({
                                        namespace: ns,
                                        workloadNames: wls,
                                    })
                                }
                            />
                        );
                    })}
                </div>
            )}

            <ConfigEditorModal
                isOpen={isEditorOpen}
                initialData={editingItem}
                isSecret={viewType === "secrets"}
                currentNamespace={namespace === "all" ? "app-mes" : namespace}
                isSaving={isSaving}
                onClose={() => setIsEditorOpen(false)}
                onSave={handleSave}
            />

            <DeleteConfirmModal
                isOpen={Boolean(deleteTarget)}
                name={deleteTarget?.name || ""}
                namespace={deleteTarget?.namespace || ""}
                isSecret={viewType === "secrets"}
                isDeleting={isDeleting}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
            />

            <RestartConfirmModal
                isOpen={Boolean(restartTarget)}
                workloadNames={restartTarget?.workloadNames || []}
                namespace={restartTarget?.namespace || ""}
                isRestarting={isRestarting}
                onClose={() => setRestartTarget(null)}
                onConfirm={handleRestartConfirm}
            />

            {toastMessage && (
                <div
                    className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium animate-in slide-in-from-bottom-3 duration-200 ${
                        toastMessage.type === "success"
                            ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
                            : "bg-rose-950/90 border-rose-500/50 text-rose-200"
                    }`}
                >
                    {toastMessage.type === "success" ? (
                        <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                    ) : (
                        <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                    )}
                    <span>{toastMessage.text}</span>
                    <button
                        type="button"
                        onClick={() => setToastMessage(null)}
                        className="ml-2 text-xs opacity-60 hover:opacity-100 transition-all cursor-pointer p-0.5"
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
    );
};
