import { KeyRound, RefreshCw, ShieldCheck } from "lucide-react"
import type { SecurityHeaderProps } from "../../../types/component/security"
import { Button } from "../../common/Button"

const formatScanDate = (dateStr?: string): string | null => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return null
    return date.toLocaleString('hu-HU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    })
}

export const SecurityHeader = ({ lastScanDate, onRefresh, onOpenRotateModal, isRefreshing = false }: SecurityHeaderProps) => {
    const formattedScanDate = formatScanDate(lastScanDate)

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
                    <ShieldCheck className="w-6 h-6 text-cud-teal shrink-0" />
                    Biztonsági Központ & DevSecOps
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                    Automatizált Trivy konténer vizsgálat, függőség-audit, TLS tanúsítványok és Secret megfelelőség.
                    {formattedScanDate && (
                        <span className="text-xs text-slate-500 ml-2">
                            (Utolsó vizsgálat: {formattedScanDate})
                        </span>
                    )}
                </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
                {onRefresh && (
                    <Button
                        variant="secondary"
                        size="sm"
                        loading={isRefreshing}
                        icon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
                        onClick={onRefresh}
                    >
                        Újravizsgálat
                    </Button>
                )}

                <Button
                    variant="primary"
                    size="sm"
                    icon={<KeyRound className="w-4 h-4" />}
                    onClick={onOpenRotateModal}
                >
                    Root Jelszó Rotálás
                </Button>
            </div>
        </div>
    )
}
