import type { ProbeStatusBoxProps } from "../../../types/component/healthcheck/probeStatusBoxProps";

export const ProbeStatusBox = ({ title, icon, probe }: ProbeStatusBoxProps) => {
    const isConfigured = probe && probe.enabled;
    return (
        <div className={`p-3 rounded-xl border flex flex-col justify-between min-h-32 transition-colors ${isConfigured
            ? 'bg-slate-950/60 border-slate-800'
            : 'bg-slate-950/30 border-slate-800/40 opacity-70'
            }`}>
            <div className="flex items-center justify-between gap-1.5 mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-slate-400 shrink-0">{icon}</span>
                    <span className="text-xs font-semibold text-slate-200 truncate">{title}</span>
                </div>
                {isConfigured ? (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cud-skyblue font-medium shrink-0">
                        {probe.type === 'httpGet' ? 'HTTP' : probe.type === 'tcpSocket' ? 'TCP' : 'EXEC'}
                    </span>
                ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-500 font-medium shrink-0">
                        Inaktív
                    </span>
                )}
            </div>

            {isConfigured ? (
                <div className="space-y-1 my-1">
                    <div className="text-xs text-slate-100 font-mono truncate" title={probe.httpPath || String(probe.port || '')}>
                        {probe.httpPath || (probe.port ? `Port: ${probe.port}` : (probe.command?.[0] || 'Parancs'))}
                    </div>
                    <div className="text-[11px] text-slate-400">
                        Gyakoriság: <span className="text-slate-300">{probe.periodSeconds ?? 10}s</span>
                        {probe.timeoutSeconds ? ` (timeout: ${probe.timeoutSeconds}s)` : ''}
                    </div>
                </div>
            ) : (
                <div className="py-2 text-[11px] text-slate-500 italic">
                    Nincs beállított szonda
                </div>
            )}

            <div className="text-[10px] text-slate-500 mt-1 border-t border-slate-800/60 pt-1 flex justify-between">
                <span>Késleltetés:</span>
                <span className="font-mono text-slate-400">{isConfigured ? `${probe.initialDelaySeconds ?? 0}s` : '-'}</span>
            </div>
        </div>
    )
}