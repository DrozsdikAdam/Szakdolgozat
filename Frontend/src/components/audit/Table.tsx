import type { AuditTableProps } from "../../types/audit/AuditLogProps"
import { AuditActionBadge, AuditEntityTypeBadge } from "../common/Badges"

export const AuditTable = ({ logs }: AuditTableProps) => {
    return (
        <div className="overflow-x-auto w-full">
            <table className="w-full border-collapse rounded-xl overflow-hidden">
                <thead className="bg-slate-900/60 border-b border-slate-700">
                    <tr className="border-b border-slate-700">
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-32">Felhasználó</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-32">Művelet</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-32">Entitás</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-32">Entitás ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-32">Részletek</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-32">IP cím</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-32">Időpont</th>
                    </tr>
                </thead>
                <tbody className="bg-slate-900/60 divide-y divide-slate-700">
                    {logs.map((log) => (
                        <tr key={log.id} className="border-b border-slate-700 last:border-b-0 hover:bg-slate-800/60 transition-colors">
                            <td className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">
                                <span className="font-medium text-slate-200">{log.username}</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap"><AuditActionBadge action={log.action} /></td>
                            <td className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap"><AuditEntityTypeBadge type={log.entityType} /></td>
                            <td className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">{log.entityId ? log.entityId : "-"}</td>
                            <td className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">{log.details}</td>
                            <td className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">{log.ipAddress ? log.ipAddress : "-"}</td>
                            <td className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">{new Date(log.timestamp).toLocaleString("hu-HU")}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}