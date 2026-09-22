import { useState } from "react";
import { LayoutDashboard, ExternalLink, Maximize2, Minimize2, Info } from "lucide-react";
import type { GrafanaDashboardEmbedProps } from "../../../types/component/telemetry";
import { Card } from "../../common/Card";
import { Badge } from "../../common/Badge";
import { Button } from "../../common/Button";

import { ErrorState } from "../../common/ErrorState";

export const GrafanaDashboardEmbed = ({
    dashboards,
    activeDashboardId,
    onSelectDashboard,
    isOnline = false
}: GrafanaDashboardEmbedProps) => {
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [forceShowIframe, setForceShowIframe] = useState<boolean>(false);

    if (dashboards.length === 0) return null;

    const activeDashboard = dashboards.find((d) => d.id === activeDashboardId) || dashboards[0]!;

    const getCategoryVariant = (category: string) => {
        switch (category) {
            case "Cluster":
                return "teal";
            case "Network":
                return "skyblue";
            case "Database":
                return "purple";
            default:
                return "neutral";
        }
    };

    const shouldRenderIframe = isOnline || forceShowIframe;

    return (
        <Card
            hoverEffect={false}
            className={`transition-all duration-300 ${isFullscreen
                ? "fixed inset-2 sm:inset-6 z-50 bg-slate-950/95 border-slate-700 shadow-2xl flex flex-col overflow-hidden"
                : "p-4 sm:p-5"
                }`}
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-cud-orange shrink-0">
                        <LayoutDashboard className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/70 border border-slate-800 overflow-x-auto max-w-full">
                        {dashboards.map((dash) => {
                            const isActive = dash.id === activeDashboard.id;
                            return (
                                <button
                                    key={dash.id}
                                    type="button"
                                    onClick={() => onSelectDashboard(dash.id)}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 whitespace-nowrap flex items-center gap-2 ${isActive
                                        ? "bg-cud-skyblue text-slate-950 font-bold shadow-sm"
                                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                                        }`}
                                >
                                    <span>{dash.title}</span>
                                    {isActive && (
                                        <Badge
                                            variant={getCategoryVariant(dash.category)}
                                            text={dash.category}
                                            size="sm"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        icon={isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    >
                        {isFullscreen ? "Kicsinyítés" : "Teljes képernyő"}
                    </Button>

                    <a
                        href={activeDashboard.externalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                    >
                        <span>Grafana</span>
                        <ExternalLink className="w-3.5 h-3.5 text-cud-skyblue" />
                    </a>
                </div>
            </div>

            <div className="flex items-center justify-between gap-2 py-3 px-1 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-cud-skyblue shrink-0" />
                    <span>{activeDashboard.description}</span>
                </div>
                <span className="hidden sm:inline font-mono text-[11px] text-slate-500">
                    Kiosk mód (TV dashboard)
                </span>
            </div>

            {shouldRenderIframe ? (
                <div className={`relative w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950/90 ${isFullscreen ? "flex-1 min-h-0" : "h-145"}`}>
                    <iframe
                        src={activeDashboard.embedUrl}
                        title={activeDashboard.title}
                        className="w-full h-full border-0"
                        loading="lazy"
                    />
                </div>
            ) : (
                <div className={`relative w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950/40 flex items-center justify-center p-6 ${isFullscreen ? "flex-1 min-h-0" : "min-h-145"}`}>
                    <ErrorState
                        type="connection-refused"
                        targetService="Grafana"
                        targetUrl={activeDashboard.embedUrl}
                        errorCode="ERR_CONNECTION_REFUSED"
                        title="A Grafana kapcsolat visszautasítva"
                        message="A beágyazott dashboard eléréséhez a Grafana K8s pod elindítása szükséges. Mivel a manifesztek még nincsenek élesítve, a kapcsolat helyileg visszautasításra került."
                        troubleshootingSteps={[
                            "Ellenőrizd a Grafana pod állapotát: kubectl get pods -n platform-infra",
                            "Port-forward beállítása: kubectl port-forward -n platform-infra svc/grafana 3001:80",
                            "Győződj meg a Grafana manifestek és ConfigMap-ek sikeres telepítéséről"
                        ]}
                        action={
                            <Button
                                variant="secondary"
                                size="md"
                                onClick={() => setForceShowIframe(true)}
                            >
                                Iframe betöltése mindenképp
                            </Button>
                        }
                    />
                </div>
            )}
        </Card>
    );
};


