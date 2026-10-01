import { KeyRound, Lock } from "lucide-react"
import type { InfrastructureSecurityCardsProps } from "../../../types/component/security"
import { SECRET_STATUS_BADGES, TLS_STATUS_BADGES } from "../../../constants/security"
import { Card } from "../../common/Card"
import { Badge } from "../../common/Badge"
import { Skeleton } from "../../common/Skeleton"

export const InfrastructureSecurityCards = ({ tlsCertificates, secretCompliance, isLoading = false }: InfrastructureSecurityCardsProps) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card hoverEffect={false} className="p-5 border border-slate-800">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-slate-800/80 text-cud-teal border border-slate-700/60">
                            <Lock className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-100">
                                TLS / SSL Tanúsítványok
                            </h3>
                            <p className="text-xs text-slate-400">
                                Ingress és szolgáltatás titkosítási állapot
                            </p>
                        </div>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                        {tlsCertificates.length} tanúsítvány
                    </span>
                </div>

                <div className="mt-4 divide-y divide-slate-800/60">
                    {tlsCertificates.length === 0 ? (
                        <p className="text-xs text-slate-500 py-4 text-center">
                            Nincs regisztrált TLS tanúsítvány adat.
                        </p>
                    ) : (
                        tlsCertificates.map((cert) => {
                            const badge = TLS_STATUS_BADGES[cert.state] || TLS_STATUS_BADGES.VALID

                            return (
                                <div key={cert.name} className="py-3 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-semibold text-slate-200 font-mono truncate">
                                                {cert.name}
                                            </p>
                                            {cert.k8sSecret && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                                                    {cert.k8sSecret}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            Kibocsátó: {cert.issuer}
                                            {cert.validTo && ` • Érvényes: ${new Date(cert.validTo).toLocaleDateString("hu-HU")}`}
                                        </p>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <Badge
                                            variant={badge.variant}
                                            text={`${badge.text} (${cert.daysRemaining} nap)`}
                                            pulse={badge.pulse}
                                            size="sm"
                                        />
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </Card>

            <Card hoverEffect={false} className="p-5 border border-slate-800">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-slate-800/80 text-cud-skyblue border border-slate-700/60">
                            <KeyRound className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-100">
                                Secret & Jelszó Megfelelőség
                            </h3>
                            <p className="text-xs text-slate-400">
                                K8s Secrets rotáció és jelszóerősség
                            </p>
                        </div>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                        {secretCompliance.length} ellenőrizve
                    </span>
                </div>

                <div className="mt-4 divide-y divide-slate-800/60">
                    {secretCompliance.length === 0 ? (
                        <p className="text-xs text-slate-500 py-4 text-center">
                            Nincs regisztrált titok megfelelőségi adat.
                        </p>
                    ) : (
                        secretCompliance.map((item) => {
                            const badge = SECRET_STATUS_BADGES[item.rotationState] || SECRET_STATUS_BADGES.COMPLIANT

                            return (
                                <div key={item.name} className="py-3 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-semibold text-slate-200 font-mono truncate">
                                                {item.name}
                                            </p>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                                                {item.namespace}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            Típus: {item.type} • Kor: {item.ageDays} nap
                                        </p>
                                        {item.lastModified && (
                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                                Utolsó módosítás: {new Date(item.lastModified).toLocaleDateString("hu-HU")}
                                            </p>
                                        )}
                                    </div>

                                    <div className="text-right shrink-0">
                                        <Badge
                                            variant={badge.variant}
                                            text={badge.text}
                                            pulse={badge.pulse}
                                            size="sm"
                                        />
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </Card>
        </div>
    )
}

