import { Activity, Archive, Cpu, Server, ShieldAlert, Terminal, ToggleRight, Wrench } from "lucide-react";
import type { ServiceItem } from "../types/component/hub";
import type { FeatureFlagName, PlatformStatusResponse } from "../types/platform";
import type { ClusterOverviewDto } from "../types/k8s";

export const DEFAULT_SERVICES: ServiceItem[] = [
    {
        id: 'setup',
        accentColor: 'teal',
        label: "Rendszer Inicializálás (Setup)",
        description: "GitOps repository, adatbázis motor, tároló réteg és erőforráskeretek beállítása és élesítése.",
        iconName: <Wrench className="w-6 h-6" />,
        badgeText: "Inicializálva",
        badgeVariant: 'teal',
        isConfigured: true,
        statusLabel: "Rendszer élesítve",
        statusVariant: 'teal'
    },
    {
        id: 'features',
        accentColor: 'orange',
        label: "Funkciókapcsolók (Feature Flags)",
        description: "Platform modulok (PgBouncer, HAProxy, Karbantartási mód) dinamikus kapcsolása futásidőben.",
        iconName: <ToggleRight className="w-6 h-6" />,
        badgeText: "7 aktív flag",
        badgeVariant: 'orange',
        isConfigured: true,
        statusLabel: "Dinamikus funkcióvezérlés",
        statusVariant: 'teal'
    },
    {
        id: 'cluster',
        accentColor: 'teal',
        label: "Klaszter és Podok",
        description: "Kubernetes workloadok, pod állapotok és újraindítások valós idejű monitorozása.",
        iconName: <Server className="w-6 h-6" />,
        badgeText: "Klaszter aktív",
        badgeVariant: 'teal',
        isConfigured: true,
        statusLabel: "Klaszter kapcsolat aktív",
        statusVariant: 'teal'
    },
    {
        id: 'traffic',
        accentColor: 'skyblue',
        label: "Forgalom és Rate Limiting",
        description: "NGINX Ingress kérés-szabályozás és RPS sávszélesség korlátozás valós időben.",
        iconName: <Activity className="w-6 h-6" />,
        badgeText: "100 rps limit",
        badgeVariant: 'skyblue',
        isConfigured: true,
        statusLabel: "Ingress védelem aktív",
        statusVariant: 'teal'
    },
    {
        id: 'autoscaling',
        accentColor: 'purple',
        label: "Automatikus Skálázás (HPA / VPA)",
        description: "Horizontális pod autoscaling (terhelésalapú) és vertikális erőforrás-ajánlások.",
        iconName: <Cpu className="w-6 h-6" />,
        badgeText: "2 - 10 Pod skála",
        badgeVariant: 'purple',
        isConfigured: true,
        statusLabel: "Autoscaling üzemkész",
        statusVariant: 'teal'
    },
    {
        id: 'backup',
        accentColor: 'teal',
        label: "Mentések és Visszaállítás",
        description: "Katasztrófa-helyreállítási pillanatképek, K8s CronJob mentések és snapshot visszatöltés.",
        iconName: <Archive className="w-6 h-6" />,
        badgeText: "Mentések aktívak",
        badgeVariant: 'teal',
        isConfigured: true,
        statusLabel: "Katasztrófa-helyreállítás aktív",
        statusVariant: 'teal'
    },
    {
        id: 'audit',
        accentColor: 'purple',
        label: "Audit és Biztonsági Naplók",
        description: "Rendszerkonfigurációs módosítások és biztonsági események visszakövetése.",
        iconName: <ShieldAlert className="w-6 h-6" />,
        badgeText: "Audit naplózás",
        badgeVariant: 'purple',
        isConfigured: true,
        statusLabel: "Biztonsági naplózás aktív",
        statusVariant: 'teal'
    },
    {
        id: 'events',
        accentColor: 'skyblue',
        label: "Pod Naplók és Események",
        description: "Valós idejű konténer log streamer és K8s klaszter eseménynapló szűréssel és kereséssel.",
        iconName: <Terminal className="w-6 h-6" />,
        badgeText: "Streamer aktív",
        badgeVariant: 'skyblue',
        isConfigured: true,
        statusLabel: "Valós idejű naplózás üzemkész",
        statusVariant: 'teal'
    }
]

export const computeDynamicServices = (
    status?: PlatformStatusResponse | null,
    clusterOverview?: ClusterOverviewDto | null,
    isClusterHealthy: boolean = true
): ServiceItem[] => {
    if (!status) {
        return DEFAULT_SERVICES;
    }

    const activeFlags: Partial<Record<FeatureFlagName, boolean>> = status.activeFeatures ?? {};
    const flagKeys = Object.keys(activeFlags) as FeatureFlagName[];
    const activeCount = flagKeys.filter(k => Boolean(activeFlags[k])).length;
    const totalFlags = flagKeys.length || 7;

    const allPods = [
        ...(clusterOverview?.platformPods || []),
        ...(clusterOverview?.appPods || [])
    ];
    const totalPods = allPods.length;
    const runningPods = allPods.filter(p => p.status?.toLowerCase() === 'running').length;
    const errorPods = allPods.filter(p => !['running', 'succeeded', 'completed'].includes(p.status?.toLowerCase() || '')).length;

    const featureParams: Partial<Record<FeatureFlagName, Record<string, any>>> = status.featureParams ?? {};

    const isRateLimitingActive = Boolean(activeFlags.rate_limiting);
    const rateLimitRps = featureParams.rate_limiting?.rps ?? 100;

    const isHpaActive = Boolean(activeFlags.hpa_scaling);
    const hpaMin = featureParams.hpa_scaling?.minReplicas ?? 2;
    const hpaMax = featureParams.hpa_scaling?.maxReplicas ?? 6;
    const hpaCpuTarget = featureParams.hpa_scaling?.targetCpuUtil ?? 70;

    const isBackupActive = Boolean(activeFlags.cronjob_backup);
    const backupSchedule = featureParams.cronjob_backup?.schedule ?? "0 2 * * *";

    const isMaintenance = Boolean(activeFlags.maintenance_mode);

    return DEFAULT_SERVICES.map(service => {
        switch (service.id) {
            case 'setup': {
                const isReady = Boolean(status.isInitialized);
                return {
                    ...service,
                    badgeText: isReady ? "Inicializálva" : "Beállítás szükséges",
                    badgeVariant: isReady ? 'teal' : 'orange',
                    isConfigured: isReady,
                    statusLabel: isReady ? "Rendszer élesítve" : "Kezdeti setup szükséges",
                    statusVariant: isReady ? 'teal' : 'orange'
                };
            }

            case 'features': {
                return {
                    ...service,
                    badgeText: `${activeCount} / ${totalFlags} aktív`,
                    badgeVariant: isMaintenance ? 'vermillon' : activeCount === totalFlags ? 'teal' : activeCount > 0 ? 'orange' : 'vermillon',
                    isConfigured: !isMaintenance,
                    statusLabel: isMaintenance ? "Karbantartási mód aktív!" : `${activeCount}/${totalFlags} funkció üzemel`,
                    statusVariant: isMaintenance ? 'vermillon' : 'teal'
                };
            }

            case 'cluster': {
                const isReady = isClusterHealthy && errorPods === 0;
                let clusterLabel = "Klaszter üzemkész";
                let clusterVariant: 'teal' | 'orange' | 'vermillon' = 'teal';

                if (!isClusterHealthy) {
                    clusterLabel = "Kapcsolat megszakadt";
                    clusterVariant = 'vermillon';
                } else if (errorPods > 0) {
                    clusterLabel = `${errorPods} pod hibás állapotban`;
                    clusterVariant = 'orange';
                } else if (totalPods > 0) {
                    clusterLabel = `${totalPods} pod üzemel (0 hiba)`;
                    clusterVariant = 'teal';
                }

                return {
                    ...service,
                    badgeText: totalPods > 0 ? `${totalPods} Pod (${runningPods} fut)` : (isClusterHealthy ? "Klaszter Online" : "Klaszter Offline"),
                    badgeVariant: isClusterHealthy ? 'teal' : 'vermillon',
                    isConfigured: isReady,
                    statusLabel: clusterLabel,
                    statusVariant: clusterVariant
                };
            }

            case 'traffic': {
                return {
                    ...service,
                    badgeText: isRateLimitingActive ? `${rateLimitRps} RPS limit` : "Inaktív (Korlátlan)",
                    badgeVariant: isRateLimitingActive ? 'skyblue' : 'orange',
                    isConfigured: isRateLimitingActive,
                    statusLabel: isRateLimitingActive ? `Ingress védelem aktív (${rateLimitRps} RPS)` : "Forgalomkorlát inaktív",
                    statusVariant: isRateLimitingActive ? 'teal' : 'orange'
                };
            }

            case 'autoscaling': {
                return {
                    ...service,
                    badgeText: isHpaActive ? `${hpaMin}–${hpaMax} Pod skála` : "Kikapcsolva",
                    badgeVariant: isHpaActive ? 'purple' : 'orange',
                    isConfigured: isHpaActive,
                    statusLabel: isHpaActive ? `Terhelésalapú skálázás (${hpaCpuTarget}% CPU)` : "Statikus méretezés (HPA ki)",
                    statusVariant: isHpaActive ? 'teal' : 'orange'
                };
            }

            case 'backup': {
                const backupLabel = isBackupActive
                    ? (backupSchedule === "0 2 * * *" ? "Napi mentés aktív (02:00)" : `Mentés ütemezve (${backupSchedule})`)
                    : "Mentési ütemezés felfüggesztve";
                return {
                    ...service,
                    badgeText: isBackupActive ? (backupSchedule === "0 2 * * *" ? "Napi 02:00" : `Cron: ${backupSchedule}`) : "Felfüggesztve",
                    badgeVariant: isBackupActive ? 'teal' : 'orange',
                    isConfigured: isBackupActive,
                    statusLabel: backupLabel,
                    statusVariant: isBackupActive ? 'teal' : 'orange'
                };
            }

            case 'audit': {
                return {
                    ...service,
                    badgeText: "Audit naplózás",
                    badgeVariant: 'purple',
                    isConfigured: true,
                    statusLabel: "Biztonsági naplózás aktív",
                    statusVariant: 'teal'
                };
            }

            case 'events': {
                return {
                    ...service,
                    badgeText: isClusterHealthy ? "Streamer aktív" : "Kapcsolat megszakadt",
                    badgeVariant: isClusterHealthy ? 'skyblue' : 'vermillon',
                    isConfigured: isClusterHealthy,
                    statusLabel: isClusterHealthy ? "Valós idejű naplózás és események" : "Klaszter nem érhető el",
                    statusVariant: isClusterHealthy ? 'teal' : 'vermillon'
                };
            }

            default:
                return service;
        }
    });
};