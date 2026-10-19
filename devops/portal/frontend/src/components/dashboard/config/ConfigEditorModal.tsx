import { useState, useEffect } from "react";
import { FileText, Lock, Plus, Trash2, Eye, EyeOff, AlertCircle } from "lucide-react";
import type { ConfigEditorModalProps } from "../../../types/component/config/configEditorModalProps";
import type { SecretDto } from "../../../types/config";
import { Modal } from "../../common/Modal";
import { Button } from "../../common/Button";
import { Select } from "../../common/Select";
import { useNamespaces } from "../../../hooks/useNamespaces";

interface KeyValueRow {
    id: string;
    key: string;
    value: string;
    isVisible: boolean;
}

export const ConfigEditorModal = ({
    isOpen,
    onClose,
    onSave,
    isSecret,
    initialData,
    currentNamespace,
    isSaving = false,
}: ConfigEditorModalProps) => {
    const isEditMode = Boolean(initialData);
    const { namespaceOptions, defaultPlatformNamespace } = useNamespaces(false);

    const [name, setName] = useState("");
    const [namespace, setNamespace] = useState(currentNamespace || defaultPlatformNamespace);
    const [secretType, setSecretType] = useState("Opaque");
    const [rows, setRows] = useState<KeyValueRow[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        setErrorMessage(null);
        if (initialData) {
            setName(initialData.name);
            setNamespace(initialData.namespace);
            if (isSecret && "secretType" in initialData) {
                setSecretType((initialData as SecretDto).secretType || "Opaque");
            }

            const initialRows: KeyValueRow[] = Object.entries(initialData.data || {}).map(([k, v]) => ({
                id: crypto.randomUUID(),
                key: k,
                value: v === "••••••••" ? "" : v,
                isVisible: !isSecret,
            }));

            setRows(initialRows.length > 0 ? initialRows : [{ id: crypto.randomUUID(), key: "", value: "", isVisible: !isSecret }]);
        } else {
            setName("");
            setNamespace(currentNamespace && currentNamespace !== "all" ? currentNamespace : defaultPlatformNamespace);
            setSecretType("Opaque");
            setRows([
                { id: crypto.randomUUID(), key: "", value: "", isVisible: !isSecret },
            ]);
        }
    }, [isOpen, initialData, isSecret, currentNamespace]);

    const handleAddRow = () => {
        setRows((prev) => [
            ...prev,
            { id: crypto.randomUUID(), key: "", value: "", isVisible: !isSecret },
        ]);
    };

    const handleRemoveRow = (id: string) => {
        setRows((prev) => prev.filter((r) => r.id !== id));
    };

    const handleRowChange = (id: string, field: "key" | "value", val: string) => {
        setRows((prev) =>
            prev.map((r) => (r.id === id ? { ...r, [field]: val } : r))
        );
    };

    const handleToggleVisibility = (id: string) => {
        setRows((prev) =>
            prev.map((r) => (r.id === id ? { ...r, isVisible: !r.isVisible } : r))
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        const trimmedName = name.trim();
        if (!trimmedName) {
            setErrorMessage("A név megadása kötelező.");
            return;
        }

        // Validate K8s name format
        const k8sNameRegex = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;
        if (!k8sNameRegex.test(trimmedName)) {
            setErrorMessage("A név csak kisbetűket, számokat és kötőjelet tartalmazhat (pl. app-config).");
            return;
        }

        const dataPayload: Record<string, string> = {};
        const seenKeys = new Set<string>();

        for (const r of rows) {
            const trimmedKey = r.key.trim();
            if (!trimmedKey) continue;

            if (seenKeys.has(trimmedKey)) {
                setErrorMessage(`Duplikált kulcs található: '${trimmedKey}'`);
                return;
            }

            seenKeys.add(trimmedKey);
            dataPayload[trimmedKey] = r.value;
        }

        if (Object.keys(dataPayload).length === 0) {
            setErrorMessage("Legalább egy kulcs-érték párt meg kell adni.");
            return;
        }

        try {
            await onSave(
                {
                    name: trimmedName,
                    namespace,
                    data: dataPayload,
                    ...(isSecret ? { secretType } : {}),
                },
                isSecret
            );
            onClose();
        } catch (err) {
            setErrorMessage((err as any)?.message || "Hiba történt a mentés során.");
        }
    };

    const secretTypeOptions = [
        { value: "Opaque", label: "Opaque (Általános titok)" },
        { value: "kubernetes.io/basic-auth", label: "Basic Auth" },
        { value: "kubernetes.io/tls", label: "TLS Tanúsítvány" },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                isEditMode
                    ? `${initialData?.name} szerkesztése`
                    : isSecret
                        ? "Új Secret (Titok) Létrehozása"
                        : "Új ConfigMap Létrehozása"
            }
            subtitle={
                isSecret
                    ? "Biztonságos, titkosított környezeti változók és hitelesítő adatok kezelése"
                    : "Környezeti konfigurációs változók beállítása a workloadok számára"
            }
            icon={isSecret ? <Lock className="w-5 h-5 text-cud-purple" /> : <FileText className="w-5 h-5 text-cud-teal" />}
            maxWidth="2xl"
            footer={
                <div className="px-5 py-3 flex items-center justify-end gap-3">
                    <Button variant="secondary" size="md" onClick={onClose} disabled={isSaving}>
                        Mégse
                    </Button>
                    <Button
                        variant="primary"
                        size="md"
                        type="button"
                        onClick={handleSubmit}
                        loading={isSaving}
                    >
                        {isEditMode ? "Változtatások mentése" : "Létrehozás és alkalmazás"}
                    </Button>
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[65vh]">
                {errorMessage && (
                    <div className="p-3 rounded-xl bg-cud-vermillon-bg border border-cud-vermillon-border flex items-start gap-2.5 text-xs text-cud-vermillon">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                {/* Metadata Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                            Konfiguráció Neve *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isEditMode}
                            placeholder={isSecret ? "pl. app-secret" : "pl. app-config"}
                            className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-900/80 text-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-cud-skyblue/50 disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                        {isEditMode && (
                            <p className="text-[11px] text-slate-500 mt-1">A név meglévő erőforrás esetén nem módosítható.</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                            Kubernetes Névtér *
                        </label>
                        <Select
                            value={namespace}
                            onChange={(val) => setNamespace(String(val))}
                            options={namespaceOptions}
                            disabled={isEditMode}
                            size="md"
                            className="w-full"
                        />
                    </div>
                </div>

                {isSecret && (
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                            Titok Típusa (Secret Type)
                        </label>
                        <Select
                            value={secretType}
                            onChange={(val) => setSecretType(String(val))}
                            options={secretTypeOptions}
                            disabled={isEditMode}
                            size="md"
                            className="w-full"
                        />
                    </div>
                )}

                {/* Key-Value Editor */}
                <div className="pt-2">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                            Kulcs-érték párok ({rows.length})
                        </label>
                        <Button
                            variant="secondary"
                            size="sm"
                            icon={<Plus className="w-3.5 h-3.5" />}
                            onClick={handleAddRow}
                        >
                            Kulcs hozzáadása
                        </Button>
                    </div>

                    <div className="space-y-2.5">
                        {rows.map((row, idx) => (
                            <div
                                key={row.id}
                                className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800"
                            >
                                <div className="w-1/3 min-w-30">
                                    <input
                                        type="text"
                                        value={row.key}
                                        onChange={(e) => handleRowChange(row.id, "key", e.target.value)}
                                        placeholder={`KULCS_${idx + 1}`}
                                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-200 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-cud-skyblue"
                                    />
                                </div>

                                <div className="flex-1 relative">
                                    <input
                                        type={isSecret && !row.isVisible ? "password" : "text"}
                                        value={row.value}
                                        onChange={(e) => handleRowChange(row.id, "value", e.target.value)}
                                        placeholder={isSecret ? "Titkosított érték..." : "Érték..."}
                                        className="w-full px-2.5 py-1.5 pr-8 rounded-lg border border-slate-800 bg-slate-900 text-slate-200 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-cud-skyblue"
                                    />

                                    {isSecret && (
                                        <button
                                            type="button"
                                            onClick={() => handleToggleVisibility(row.id)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                                            title={row.isVisible ? "Elrejtés" : "Megjelenítés"}
                                        >
                                            {row.isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        </button>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleRemoveRow(row.id)}
                                    disabled={rows.length === 1}
                                    className="p-1.5 text-slate-400 hover:text-cud-vermillon disabled:opacity-30 transition-colors cursor-pointer rounded-lg hover:bg-slate-800"
                                    title="Sor törlése"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </form>
        </Modal>
    );
};
