import { useState, type ReactNode } from "react";
import {
    Cpu,
    Database,
    Gauge,
    GitBranch,
    HardDrive,
    ListCheck,
    Pencil,
    ChevronDown,
    AlertCircle,
    Server,
    Shield,
    Zap,
    Lock,
    Globe,
    Layers,
    Radio,
} from "lucide-react";
import type { ReviewStepProps } from "../../../types/component/setup/reviewProps";
import { Badge } from "../../common/Badge";

export const ReviewStep = ({ data, onGoToStep }: ReviewStepProps) => {
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        GIT: data.gitEnabled,
        DATABASE: data.dbEnabled,
        STORAGE: data.storageEnabled,
        TRAFFIC: data.trafficEnabled,
        AUTOSCALING: data.autoscalingEnabled,
    });

    interface AccordionDefinition {
        title: string;
        icon: ReactNode;
        badge: ReactNode;
        goToStep: number;
    }

    const AccordionData: Record<string, AccordionDefinition> = {
        GIT: {
            title: "GitOps & Forráskód Integráció",
            icon: <GitBranch className="w-5 h-5 text-cud-teal" />,
            badge: (
                <Badge
                    variant={data.gitEnabled ? "teal" : "vermillon"}
                    size="sm"
                    text={data.gitEnabled ? "Bekapcsolva" : "Kikapcsolva"}
                />
            ),
            goToStep: 1,
        },
        DATABASE: {
            title: "Adatbázis Konfiguráció",
            icon: <Database className="w-5 h-5 text-cud-teal" />,
            badge: (
                <Badge
                    variant={data.dbEnabled ? "teal" : "vermillon"}
                    size="sm"
                    text={data.dbEnabled ? "Bekapcsolva" : "Kikapcsolva"}
                />
            ),
            goToStep: 2,
        },
        STORAGE: {
            title: "Objektumtárolás & S3 Perzisztencia",
            icon: <HardDrive className="w-5 h-5 text-cud-teal" />,
            badge: (
                <Badge
                    variant={data.storageEnabled ? "teal" : "vermillon"}
                    size="sm"
                    text={data.storageEnabled ? "Bekapcsolva" : "Kikapcsolva"}
                />
            ),
            goToStep: 3,
        },
        TRAFFIC: {
            title: "Hálózat, Forgalomirányítás és Load Balancing",
            icon: <Gauge className="w-5 h-5 text-cud-teal" />,
            badge: (
                <Badge
                    variant={data.trafficEnabled ? "teal" : "vermillon"}
                    size="sm"
                    text={data.trafficEnabled ? "Bekapcsolva" : "Kikapcsolva"}
                />
            ),
            goToStep: 4,
        },
        AUTOSCALING: {
            title: "Skálázási Politikák & Erőforrás-Optimalizáció",
            icon: <Cpu className="w-5 h-5 text-cud-teal" />,
            badge: (
                <Badge
                    variant={data.autoscalingEnabled ? "teal" : "vermillon"}
                    size="sm"
                    text={data.autoscalingEnabled ? "Bekapcsolva" : "Kikapcsolva"}
                />
            ),
            goToStep: 5,
        },
    };

    const toggleSection = (key: string) => {
        setOpenSections((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const handleEdit = (step: number) => {
        onGoToStep(step);
    };

    const renderDetailItem = (label: string, value: ReactNode, icon?: ReactNode) => (
        <div className="flex flex-col gap-1 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                {icon}
                {label}
            </span>
            <div className="text-xs text-slate-200 font-semibold break-all">
                {value}
            </div>
        </div>
    );

    const renderDisabledNotice = (message: string) => (
        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-950/50 border border-slate-800/60 text-slate-400 text-xs">
            <AlertCircle className="w-4 h-4 text-cud-orange shrink-0" />
            <span>{message}</span>
        </div>
    );

    const renderSectionBody = (key: string) => {
        switch (key) {
            case "GIT":
                if (!data.gitEnabled) {
                    return renderDisabledNotice(
                        "A GitOps szinkronizáció inaktív. A platform az alapértelmezett beépített konténerverzióval indul el, külső forráskód-tároló összekötése nélkül."
                    );
                }
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {renderDetailItem("Git Szolgáltató", data.gitProvider === "GITLAB" ? "GitLab CI/CD" : "GitHub Actions", <Globe className="w-3.5 h-3.5 text-cud-skyblue" />)}
                        {renderDetailItem("Tároló URL", data.repoUrl || "https://github.com/mes-corp/mes-app", <GitBranch className="w-3.5 h-3.5 text-cud-teal" />)}
                        {renderDetailItem("Telepítési Ág", data.branch || "main", <Layers className="w-3.5 h-3.5 text-slate-400" />)}
                        {renderDetailItem("Telepítési Stratégia", data.deploymentStrategy || "RollingUpdate", <Zap className="w-3.5 h-3.5 text-cud-orange" />)}
                        {renderDetailItem("Hitelesítés (PAT)", data.gitToken ? "•••••••••••••••• (Titkosítva)" : "Nyilvános tároló / Nincs token", <Lock className="w-3.5 h-3.5 text-slate-400" />)}
                        {renderDetailItem("Webhook Védelem", data.webhookSecret ? "•••••••••••• (Aktív)" : "Nincs titok beállítva", <Shield className="w-3.5 h-3.5 text-cud-purple" />)}
                    </div>
                );

            case "DATABASE": {
                if (!data.dbEnabled) {
                    return renderDisabledNotice(
                        "Belső adatbázis provisioning kikapcsolva. A szolgáltatások önálló, külső adatbázishoz csatlakozhatnak környezeti változókon keresztül."
                    );
                }

                const engineMap: Record<string, { label: string; port: number; endpoint: string }> = {
                    postgres: {
                        label: "PostgreSQL 16 (Patroni HA Klaszter)",
                        port: 5432,
                        endpoint: "mes-postgres-ha.app-mes:5432",
                    },
                    mssql: {
                        label: "Microsoft SQL Server 2022",
                        port: 1433,
                        endpoint: "mssql.platform-infra:1433",
                    },
                    oracle: {
                        label: "Oracle Database Free 23c",
                        port: 1521,
                        endpoint: "oracle.platform-infra:1521",
                    },
                };

                const currentEngine = engineMap[data.dbEngine] || engineMap.postgres;

                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {renderDetailItem("Adatbázis Motor", currentEngine.label, <Database className="w-3.5 h-3.5 text-cud-teal" />)}
                        {renderDetailItem(
                            "Üzemeltetési Mód",
                            data.dbMode === "internal" ? "Belső K8s Klaszter (Provisioning)" : "Külső Szerver Kapcsolat",
                            <Server className="w-3.5 h-3.5 text-cud-skyblue" />
                        )}
                        {renderDetailItem(
                            "Kapcsolati Végpont",
                            data.dbMode === "internal" ? currentEngine.endpoint : data.dbConnectionString || "Egyedi kapcsolati string",
                            <Radio className="w-3.5 h-3.5 text-cud-orange" />
                        )}
                        {renderDetailItem("Alapértelmezett Séma / DB", "mesdb", <Layers className="w-3.5 h-3.5 text-slate-400" />)}
                        {renderDetailItem("Hálózati Port", `${currentEngine.port} / TCP`, <Shield className="w-3.5 h-3.5 text-slate-400" />)}
                        {renderDetailItem("Magas Rendelkezésre Állás (HA)", data.dbEngine === "postgres" ? "Patroni Quorum (Aktív)" : "Standalone Deployment", <Zap className="w-3.5 h-3.5 text-cud-teal" />)}
                    </div>
                );
            }

            case "STORAGE":
                if (!data.storageEnabled) {
                    return renderDisabledNotice(
                        "S3 objektumtároló kikapcsolva. A rendszer csak a Kubernetes alapértelmezett lokális PersistentVolume tárolóit használja."
                    );
                }
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {renderDetailItem(
                            "Tároló Szolgáltató",
                            data.s3Provider === "internal" ? "Belső MinIO (K8s PVC Tároló)" : "Külső AWS S3 / Cloud Provider",
                            <HardDrive className="w-3.5 h-3.5 text-cud-teal" />
                        )}
                        {renderDetailItem("Mentési Vödör (Bucket)", data.s3Bucket || "mes-backups", <Layers className="w-3.5 h-3.5 text-cud-skyblue" />)}
                        {renderDetailItem("Lefoglalt Kóta", `${data.s3BucketSize || "5Gi"} Kapacitás`, <Server className="w-3.5 h-3.5 text-cud-orange" />)}
                        {renderDetailItem(
                            "API / Konzol Végpont",
                            data.s3Provider === "internal" ? "minio.platform-infra:9000 / :9001" : data.s3Endpoint || "AWS S3 Standard",
                            <Radio className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        {renderDetailItem("Hozzáférés (Access Key)", data.s3AccessKey ? `${data.s3AccessKey}` : "minioadmin (Belső default)", <Shield className="w-3.5 h-3.5 text-slate-400" />)}
                        {renderDetailItem("Titkos Kulcs (Secret Key)", "•••••••••••••••• (K8s SecretRef)", <Lock className="w-3.5 h-3.5 text-cud-purple" />)}
                    </div>
                );

            case "TRAFFIC":
                if (!data.trafficEnabled) {
                    return renderDisabledNotice(
                        "Forgalomkorlátozás kikapcsolva. Az NGINX Ingress Controller korlátlan sávszélességgel továbbítja a beérkező hálózati kéréseket."
                    );
                }
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {renderDetailItem("Alap Sávszélesség", `${data.rateLimitRps} RPS (Kérés / másodperc)`, <Gauge className="w-3.5 h-3.5 text-cud-skyblue" />)}
                        {renderDetailItem("Burst Túllépési Szorzó", `${data.burstMultiplier}x Terhelési többszörös`, <Zap className="w-3.5 h-3.5 text-cud-orange" />)}
                        {renderDetailItem(
                            "Maximális Puffer Kapacitás",
                            `${data.rateLimitRps * data.burstMultiplier} egyidejű kérés`,
                            <Layers className="w-3.5 h-3.5 text-cud-teal" />
                        )}
                        {renderDetailItem(
                            "Ingress Annotáció",
                            `nginx.ingress.kubernetes.io/limit-rps: "${data.rateLimitRps}"`,
                            <Radio className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        {renderDetailItem("Túlcsordulás Kezelés", "HTTP 429 Too Many Requests válasz", <AlertCircle className="w-3.5 h-3.5 text-cud-vermillon" />)}
                        {renderDetailItem("Védelmi Réteg", "Kliens IP-cím alapú sávszélesség-szabályozás", <Shield className="w-3.5 h-3.5 text-slate-400" />)}
                    </div>
                );

            case "AUTOSCALING": {
                if (data.autoscalingEnabled) {
                    return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {renderDetailItem("Működési Modell", "Dinamikus Autonóm Terheléskövetés", <Cpu className="w-3.5 h-3.5 text-cud-teal" />)}
                            {renderDetailItem(
                                "Skálázási Stratégia",
                                data.autoscalingStrategy === "vpa" ? "Vertical Pod Autoscaler (VPA)" : "Horizontal Pod Autoscaler (HPA)",
                                <Zap className="w-3.5 h-3.5 text-cud-skyblue" />
                            )}
                            {data.autoscalingStrategy === "hpa" ? (
                                <>
                                    {renderDetailItem("Replikaszám Határok", `Min: ${data.minReplicas} Pod – Max: ${data.maxReplicas} Pod`, <Layers className="w-3.5 h-3.5 text-cud-orange" />)}
                                    {renderDetailItem("Cél CPU Küszöbérték", `${data.targetCpu}% Terhelésnél új pod indul`, <Gauge className="w-3.5 h-3.5 text-cud-teal" />)}
                                    {renderDetailItem("Inaktiválási Stratégia", data.inactivationStrategy === "hot_standby" ? "Hot-Standby (1 Pod)" : "Scale-to-Zero (0 Pod)", <Shield className="w-3.5 h-3.5 text-cud-orange" />)}
                                    {renderDetailItem("Metrika Forrás", "K8s Metrics Server (15s ciklusidő)", <Radio className="w-3.5 h-3.5 text-slate-400" />)}
                                </>
                            ) : (
                                <>
                                    {renderDetailItem("CPU Korlát Határok", "100m – 1000m automatikus illesztés", <Layers className="w-3.5 h-3.5 text-cud-orange" />)}
                                    {renderDetailItem("Memória Határok", "256Mi – 1Gi dinamikus allokáció", <Server className="w-3.5 h-3.5 text-slate-400" />)}
                                    {renderDetailItem("Inaktiválási Stratégia", data.inactivationStrategy === "hot_standby" ? "Hot-Standby (1 Pod)" : "Scale-to-Zero (0 Pod)", <Shield className="w-3.5 h-3.5 text-cud-orange" />)}
                                    {renderDetailItem("VPA Mód", "Auto (In-Place / Pod Restart)", <Zap className="w-3.5 h-3.5 text-cud-teal" />)}
                                </>
                            )}
                        </div>
                    );
                }

                const sizeDetailsMap: Record<string, { label: string; desc: string }> = {
                    nano: { label: "NANO", desc: "250m CPU / 512 MiB RAM (Alacsony terhelés)" },
                    small: { label: "SMALL", desc: "500m CPU / 1.0 GiB RAM (Normál terhelés)" },
                    medium: { label: "MEDIUM", desc: "1000m CPU / 2.0 GiB RAM (Intenzív terhelés)" },
                    large: { label: "LARGE", desc: "2000m CPU / 4.0 GiB RAM (Csúcsteljesítmény)" },
                };

                const currentSize = sizeDetailsMap[data.instanceSize || "small"] || sizeDetailsMap.small;

                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {renderDetailItem("Működési Modell", "Dedikált Statikus Példányméret (Static Sizing)", <Cpu className="w-3.5 h-3.5 text-cud-orange" />)}
                        {renderDetailItem("Kiválasztott Méretosztály", currentSize.label, <Server className="w-3.5 h-3.5 text-cud-teal" />)}
                        {renderDetailItem("Garantált Erőforrás-allokáció", currentSize.desc, <Layers className="w-3.5 h-3.5 text-cud-skyblue" />)}
                        {renderDetailItem("Példányszám", "spec.replicas: 1 (Dedikált pod)", <Radio className="w-3.5 h-3.5 text-slate-400" />)}
                        {renderDetailItem("Inaktiválási Stratégia", data.inactivationStrategy === "hot_standby" ? "Hot-Standby (1 Pod)" : "Scale-to-Zero (0 Pod)", <Shield className="w-3.5 h-3.5 text-cud-orange" />)}
                        {renderDetailItem("Cél Deployment", "mes-backend (app-mes névtér)", <Zap className="w-3.5 h-3.5 text-slate-400" />)}
                    </div>
                );
            }

            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div>
                    <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                        <ListCheck className="w-5 h-5 text-cud-teal" />
                        Összefoglaló és Jóváhagyás
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        Tekintsd át és ellenőrizd a beállított szolgáltatásokat a platform inicializálása előtt.
                    </p>
                </div>
            </div>

            <div className="w-full flex flex-col gap-3">
                {Object.keys(AccordionData).map((key) => {
                    const item = AccordionData[key];
                    const isOpen = !!openSections[key];

                    return (
                        <div
                            key={key}
                            className="w-full rounded-xl border border-slate-800 bg-slate-900/80 transition-all duration-200 hover:border-slate-700/80 overflow-hidden"
                        >
                            <div
                                onClick={() => toggleSection(key)}
                                className="flex w-full items-center justify-between p-4 cursor-pointer select-none transition-colors hover:bg-slate-800/40"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60">
                                        {item.icon}
                                    </div>
                                    <span className="text-sm font-semibold text-slate-100">
                                        {item.title}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    {item.badge}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEdit(item.goToStep);
                                        }}
                                        title="Beállítások módosítása"
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <div className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-cud-teal" : ""}`}>
                                        <ChevronDown className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>

                            {isOpen && (
                                <div className="px-4 pb-4 pt-3 border-t border-slate-800/60 text-xs text-slate-300">
                                    {renderSectionBody(key)}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};