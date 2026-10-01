import type { ServiceItem } from "../types/component/hub";
import type { ClusterOverviewDto } from "../types/k8s";
import type { FeatureFlagName, PlatformStatusResponse } from "../types/platform";
import { DEFAULT_SERVICES } from "./services";

const resolveSetupStatus = (service: ServiceItem, status: PlatformStatusResponse): ServiceItem => {
    const isReady = Boolean(status.isInitialized);
    return {
        ...service,
        badgeText: isReady ? "Inicializálva" : "Beállítás szükséges",
        badgeVariant: isReady ? 'teal' : 'orange',
        isConfigured: isReady,
        statusLabel: isReady ? "Rendszer élesítve" : "Kezdeti setup szükséges",
        statusVariant: isReady ? 'teal' : 'orange'
    };
};

const resolveFeaturesStatus = (service: ServiceItem, status: PlatformStatusResponse): ServiceItem => {
    const activeFlags: Partial<Record<FeatureFlagName, boolean>> = status.activeFeatures ?? {};
    const flagKeys = Object.keys(activeFlags) as FeatureFlagName[];
    const activeCount = flagKeys.filter(k => Boolean(activeFlags[k])).length;
    const totalFlags = flagKeys.length || 7;
    const isMaintenance = Boolean(activeFlags.maintenance_mode);

    return {
        ...service,
        badgeText: `${activeCount} / ${totalFlags} aktív`,
        badgeVariant: isMaintenance ? 'vermillon' : activeCount === totalFlags ? 'teal' : activeCount > 0 ? 'orange' : 'vermillon',
        isConfigured: !isMaintenance,
        statusLabel: isMaintenance ? "Karbantartási mód aktív!" : `${activeCount}/${totalFlags} funkció üzemel`,
        statusVariant: isMaintenance ? 'vermillon' : 'teal'
    };
};

const resolveClusterStatus = (
    service: ServiceItem,
    clusterOverview?: ClusterOverviewDto | null,
    isClusterHealthy: boolean = true
): ServiceItem => {
    const allPods = [
        ...(clusterOverview?.platformPods || []),
        ...(clusterOverview?.appPods || [])
    ];
    const totalPods = allPods.length;
    const runningPods = allPods.filter(p => p.status?.toLowerCase() === 'running').length;
    const errorPods = allPods.filter(p => !['running', 'succeeded', 'completed'].includes(p.status?.toLowerCase() || '')).length;

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
        isConfigured: isClusterHealthy && errorPods === 0,
        statusLabel: clusterLabel,
        statusVariant: clusterVariant
    };
};

const resolveConfigsStatus = (service: ServiceItem, isClusterHealthy: boolean): ServiceItem => ({
    ...service,
    badgeText: isClusterHealthy ? "Config & Secrets" : "Klaszter Offline",
    badgeVariant: isClusterHealthy ? 'teal' : 'vermillon',
    isConfigured: isClusterHealthy,
    statusLabel: isClusterHealthy ? "Konfigurációkezelő aktív" : "Klaszter nem érhető el",
    statusVariant: isClusterHealthy ? 'teal' : 'vermillon'
});

const resolveTrafficStatus = (service: ServiceItem, status: PlatformStatusResponse): ServiceItem => {
    const activeFlags: Partial<Record<FeatureFlagName, boolean>> = status.activeFeatures ?? {};
    const featureParams: Partial<Record<FeatureFlagName, Record<string, any>>> = status.featureParams ?? {};
    const isRateLimitingActive = Boolean(activeFlags.rate_limiting);
    const rateLimitRps = featureParams.rate_limiting?.rps ?? 100;

    return {
        ...service,
        badgeText: isRateLimitingActive ? `${rateLimitRps} RPS limit` : "Inaktív (Korlátlan)",
        badgeVariant: isRateLimitingActive ? 'skyblue' : 'orange',
        isConfigured: isRateLimitingActive,
        statusLabel: isRateLimitingActive ? `Ingress védelem aktív (${rateLimitRps} RPS)` : "Forgalomkorlát inaktív",
        statusVariant: isRateLimitingActive ? 'teal' : 'orange'
    };
};

const resolveAutoscalingStatus = (service: ServiceItem, status: PlatformStatusResponse): ServiceItem => {
    const activeFlags: Partial<Record<FeatureFlagName, boolean>> = status.activeFeatures ?? {};
    const featureParams: Partial<Record<FeatureFlagName, Record<string, any>>> = status.featureParams ?? {};
    const isHpaActive = Boolean(activeFlags.hpa_scaling);
    const hpaMin = featureParams.hpa_scaling?.minReplicas ?? 2;
    const hpaMax = featureParams.hpa_scaling?.maxReplicas ?? 6;
    const hpaCpuTarget = featureParams.hpa_scaling?.targetCpuUtil ?? 70;

    return {
        ...service,
        badgeText: isHpaActive ? `${hpaMin}–${hpaMax} Pod skála` : "Kikapcsolva",
        badgeVariant: isHpaActive ? 'purple' : 'orange',
        isConfigured: isHpaActive,
        statusLabel: isHpaActive ? `Terhelésalapú skálázás (${hpaCpuTarget}% CPU)` : "Statikus méretezés (HPA ki)",
        statusVariant: isHpaActive ? 'teal' : 'orange'
    };
};

const resolveBackupStatus = (service: ServiceItem, status: PlatformStatusResponse): ServiceItem => {
    const activeFlags: Partial<Record<FeatureFlagName, boolean>> = status.activeFeatures ?? {};
    const featureParams: Partial<Record<FeatureFlagName, Record<string, any>>> = status.featureParams ?? {};
    const isBackupActive = Boolean(activeFlags.cronjob_backup);
    const backupSchedule = featureParams.cronjob_backup?.schedule ?? "0 2 * * *";
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
};

const resolveAuditStatus = (service: ServiceItem): ServiceItem => ({
    ...service,
    badgeText: "Audit naplózás",
    badgeVariant: 'purple',
    isConfigured: true,
    statusLabel: "Biztonsági naplózás aktív",
    statusVariant: 'teal'
});

const resolveEventsStatus = (service: ServiceItem, isClusterHealthy: boolean): ServiceItem => ({
    ...service,
    badgeText: isClusterHealthy ? "Streamer aktív" : "Kapcsolat megszakadt",
    badgeVariant: isClusterHealthy ? 'skyblue' : 'vermillon',
    isConfigured: isClusterHealthy,
    statusLabel: isClusterHealthy ? "Valós idejű naplózás és események" : "Klaszter nem érhető el",
    statusVariant: isClusterHealthy ? 'teal' : 'vermillon'
});

const resolveHealthStatus = (service: ServiceItem, isClusterHealthy: boolean): ServiceItem => ({
    ...service,
    badgeText: isClusterHealthy ? "Szondák aktívak" : "Klaszter Offline",
    badgeVariant: isClusterHealthy ? 'teal' : 'vermillon',
    isConfigured: isClusterHealthy,
    statusLabel: isClusterHealthy ? "Szonda felügyelet és öngyógyítás aktív" : "Klaszter nem érhető el",
    statusVariant: isClusterHealthy ? 'teal' : 'vermillon'
});

const resolveDeploymentsStatus = (service: ServiceItem, isClusterHealthy: boolean): ServiceItem => ({
    ...service,
    badgeText: isClusterHealthy ? "GitOps szinkron" : "Nem elérhető",
    badgeVariant: isClusterHealthy ? 'teal' : 'vermillon',
    isConfigured: isClusterHealthy,
    statusLabel: isClusterHealthy ? "Rollout és visszaállítás kész" : "Klaszter nem érhető el",
    statusVariant: isClusterHealthy ? 'teal' : 'vermillon'
});

const resolveTelemetryStatus = (service: ServiceItem, isClusterHealthy: boolean): ServiceItem => ({
    ...service,
    badgeText: isClusterHealthy ? "Metrikák aktívak" : "Nem elérhető",
    badgeVariant: isClusterHealthy ? 'teal' : 'vermillon',
    isConfigured: isClusterHealthy,
    statusLabel: isClusterHealthy ? "Prometheus & Grafana kapcsolat él" : "Kapcsolat megszakadt",
    statusVariant: isClusterHealthy ? 'teal' : 'vermillon'
});

const resolveSecurityStatus = (service: ServiceItem, isClusterHealthy: boolean): ServiceItem => ({
    ...service,
    badgeText: isClusterHealthy ? "Biztonsági modul aktív" : "Nem elérhető",
    badgeVariant: isClusterHealthy ? 'teal' : 'vermillon',
    isConfigured: isClusterHealthy,
    statusLabel: isClusterHealthy ? "Biztonsági modul aktív" : "Kapcsolat megszakadt",
    statusVariant: isClusterHealthy ? 'teal' : 'vermillon'
});

export const computeDynamicServices = (status?: PlatformStatusResponse | null, clusterOverview?: ClusterOverviewDto | null, isClusterHealthy: boolean = true): ServiceItem[] => {
    if (!status) return DEFAULT_SERVICES;

    return DEFAULT_SERVICES.map(service => {
        switch (service.id) {
            case 'setup':
                return resolveSetupStatus(service, status);
            case 'features':
                return resolveFeaturesStatus(service, status);
            case 'cluster':
                return resolveClusterStatus(service, clusterOverview, isClusterHealthy);
            case 'configs':
                return resolveConfigsStatus(service, isClusterHealthy);
            case 'traffic':
                return resolveTrafficStatus(service, status);
            case 'autoscaling':
                return resolveAutoscalingStatus(service, status);
            case 'backup':
                return resolveBackupStatus(service, status);
            case 'audit':
                return resolveAuditStatus(service);
            case 'events':
                return resolveEventsStatus(service, isClusterHealthy);
            case 'health':
                return resolveHealthStatus(service, isClusterHealthy);
            case 'deployments':
                return resolveDeploymentsStatus(service, isClusterHealthy);
            case 'telemetry':
                return resolveTelemetryStatus(service, isClusterHealthy);
            case 'security':
                return resolveSecurityStatus(service, isClusterHealthy);
            default:
                return service;
        }
    });
};