import { useState } from "react";
import { FileText, Lock, Eye, EyeOff, Pencil, Trash2, RotateCw, Layers, Copy, Check } from "lucide-react";
import type { ConfigCardProps } from "../../../types/component/config/configCardProps";
import type { SecretDto } from "../../../types/config";
import { Badge } from "../../common/Badge";
import { Button } from "../../common/Button";

export const ConfigCard = ({
    item,
    isSecret,
    revealedData,
    isRevealing = false,
    onRevealToggle,
    onEdit,
    onDelete,
    onRestartWorkload,
}: ConfigCardProps) => {
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const isCurrentlyRevealed = Boolean(revealedData);
    const dataToDisplay = isSecret
        ? (revealedData || item.data)
        : item.data;

    const keys = Object.keys(dataToDisplay);
    const boundWorkloads = item.boundWorkloads || [];

    const handleCopy = (key: string, value: string) => {
        navigator.clipboard.writeText(value);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const namespaceBadgeVariant = item.namespace === "platform-infra" ? "teal" : "skyblue";

    return (
        <div className="flex flex-col bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700/80 transition-all duration-200 shadow-md">
            {/* Header */}
            <div className="p-4 border-b border-slate-800/80 bg-slate-900/90 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div
                        className={`p-2.5 rounded-xl border shrink-0 ${
                            isSecret
                                ? "bg-cud-purple-bg text-cud-purple border-cud-purple-border"
                                : "bg-cud-teal-bg text-cud-teal border-cud-teal-border"
                        }`}
                    >
                        {isSecret ? <Lock className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm sm:text-base font-bold text-slate-100 font-mono truncate" title={item.name}>
                                {item.name}
                            </h3>
                            <Badge
                                variant={isSecret ? "purple" : "teal"}
                                text={`${keys.length} kulcs`}
                                size="sm"
                            />
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                            {new Date(item.createdAt).toLocaleString("hu-HU", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                    <Badge
                        variant={namespaceBadgeVariant}
                        text={item.namespace}
                        size="sm"
                    />
                    {isSecret && (
                        <Badge
                            variant="neutral"
                            text={(item as SecretDto).secretType || "Opaque"}
                            size="sm"
                        />
                    )}
                </div>
            </div>

            {/* Bound Workloads Bar */}
            {boundWorkloads.length > 0 && (
                <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/60 flex items-center justify-between gap-2 flex-wrap text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400">
                        <Layers className="w-3.5 h-3.5 text-cud-skyblue" />
                        <span>Csatolt workloadok:</span>
                        <div className="flex items-center gap-1 flex-wrap">
                            {boundWorkloads.map((wl) => (
                                <span
                                    key={wl}
                                    className="px-2 py-0.5 rounded-md bg-slate-800 text-cud-skyblue border border-slate-700 font-mono text-[11px]"
                                >
                                    {wl}
                                </span>
                            ))}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => onRestartWorkload(item.namespace, boundWorkloads)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer text-[11px]"
                        title="Workloadok azonnali gördülő újraindítása az új adatok betöltéséhez"
                    >
                        <RotateCw className="w-3 h-3 text-cud-orange" />
                        <span>Újraindítás</span>
                    </button>
                </div>
            )}

            {/* Key-Value Preview */}
            <div className="flex-1 p-4">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Változók & Adatok
                    </span>

                    {isSecret && onRevealToggle && (
                        <button
                            type="button"
                            onClick={() => onRevealToggle(item as SecretDto)}
                            disabled={isRevealing}
                            className="inline-flex items-center gap-1.5 text-xs text-cud-skyblue hover:text-cud-skyblue/80 transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {isCurrentlyRevealed ? (
                                <>
                                    <EyeOff className="w-3.5 h-3.5" />
                                    <span>Elrejtés</span>
                                </>
                            ) : (
                                <>
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>{isRevealing ? "Feloldás..." : "Értékek felfedése"}</span>
                                </>
                            )}
                        </button>
                    )}
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {keys.length === 0 ? (
                        <div className="text-xs text-slate-500 italic py-2">Nincsenek beállított kulcsok</div>
                    ) : (
                        keys.map((key) => {
                            const val = dataToDisplay[key] ?? "";
                            const isCopied = copiedKey === key;

                            return (
                                <div
                                    key={key}
                                    className="group flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 text-xs font-mono transition-colors"
                                >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <span className="text-slate-300 font-semibold truncate shrink-0" title={key}>
                                            {key}:
                                        </span>
                                        <span
                                            className={`truncate ${
                                                isSecret && !isCurrentlyRevealed
                                                    ? "text-slate-500 tracking-widest font-sans"
                                                    : "text-slate-400"
                                            }`}
                                            title={val}
                                        >
                                            {val}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleCopy(key, val)}
                                        className="p-1 text-slate-500 hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity rounded shrink-0 cursor-pointer"
                                        title="Másolás vágólapra"
                                    >
                                        {isCopied ? (
                                            <Check className="w-3.5 h-3.5 text-cud-teal" />
                                        ) : (
                                            <Copy className="w-3.5 h-3.5" />
                                        )}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-end gap-2 shrink-0">
                <Button
                    variant="secondary"
                    size="sm"
                    icon={<Pencil className="w-3.5 h-3.5" />}
                    onClick={() => onEdit(item)}
                >
                    Szerkesztés
                </Button>

                <Button
                    variant="danger"
                    size="sm"
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                    onClick={() => onDelete(item)}
                >
                    Törlés
                </Button>
            </div>
        </div>
    );
};
