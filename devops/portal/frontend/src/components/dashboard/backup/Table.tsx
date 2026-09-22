import { Archive, RefreshCw } from "lucide-react";
import type { BackupTableProps } from "../../../types/component/backup/backupTableProps";
import { Card } from "../../common/Card";
import { EmptyState } from "../../common/EmptyState";
import { useMemo } from "react";
import { Badge } from "../../common/Badge";
import { Button } from "../../common/Button";
import type { BackupStatus } from "../../../types/backup";
import type { BadgeProps } from "../../../types/component/badgeProps";

export const BackupTable = ({ backups, isLoading, searchQuery, onSelectRestore }: BackupTableProps) => {

    const badgeObject: Record<BackupStatus, BadgeProps> = {
        SYNCED: { text: "S3 Szinkronizálva", variant: "teal", pulse: false },
        STAGED_LOCALLY: { text: "Helyi mentés", variant: "skyblue", pulse: false },
        FAILED: { text: "Sikertelen", variant: "vermillon", pulse: false },
        RESTORE_COMPLETED: { text: "Visszaállítás lefutott", variant: "orange", pulse: false },
        RESTORE_SUCCESS: { text: "Sikeresen visszatöltve", variant: "purple", pulse: true },
    }

    const filteredBackups = useMemo(() => {
        if (!searchQuery) return backups
        return backups.filter((backup) => backup.filename.toLowerCase().includes(searchQuery.toLowerCase()))
    }, [backups, searchQuery])


    return (
        <Card hoverEffect={false} className="p-0 overflow-hidden border border-slate-800">
            {isLoading && (
                <div className="py-16 flex flex-col items-center justify-center text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin text-cud-skyblue mb-3" />
                    <p className="text-sm font-medium">Mentési archívumok lekérése...</p>
                </div>
            )}

            {!isLoading && filteredBackups.length === 0 && (
                <div className="p-6">
                    <EmptyState
                        icon={<Archive className="w-8 h-8 text-slate-500" />}
                        title="Nincs megjeleníthető mentési archívum"
                        description={
                            searchQuery
                                ? `Nem található mentési archívum a(z) "${searchQuery}" keresőkifejezésre.`
                                : "Jelenleg nincsenek rögzített mentési archívumok."
                        }
                    />
                </div>
            )}

            {!isLoading && filteredBackups.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                <th className="py-3.5 px-4">Fájlnév</th>
                                <th className="py-3.5 px-4">Méret</th>
                                <th className="py-3.5 px-4">S3 útvonal</th>
                                <th className="py-3.5 px-4">Létrehozva</th>
                                <th className="py-3.5 px-4">Állapot</th>
                                <th className="py-3.5 px-4">Művelet</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-sm">
                            {filteredBackups.map((backup) => (
                                <tr
                                    key={backup.id}
                                    className="transition-colors duration-150 hover:bg-slate-800/40"
                                >
                                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-400 font-mono">
                                        {backup.filename}
                                    </td>
                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                        {(backup.size / (1024 * 1024)).toFixed(2)} MB
                                    </td>
                                    <td className="py-3.5 px-4 text-slate-200 text-sm leading-relaxed">
                                        {backup.s3Path}
                                    </td>
                                    <td className="py-3.5 px-4 text-slate-200 text-sm leading-relaxed">
                                        {new Date(backup.createdAt).toLocaleString("hu-HU")}
                                    </td>
                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                        <Badge
                                            variant={badgeObject[backup.status].variant}
                                            text={badgeObject[backup.status].text}
                                            pulse={badgeObject[backup.status].pulse}
                                            size="sm"
                                        />
                                    </td>
                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => onSelectRestore(backup)}
                                            disabled={isLoading}
                                        >
                                            Helyreállítás
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    )
}