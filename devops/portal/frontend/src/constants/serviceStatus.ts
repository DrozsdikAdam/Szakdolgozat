import type { ServiceItem } from "../types/component/hub";
import type { ClusterOverviewDto, RateLimitResponseDto } from "../types/k8s";
import type { DatabaseOverviewDto } from "../types/database";
import type { SecurityOverviewDto } from "../types/security";
import type { FeatureFlagName, PlatformStatusResponse } from "../types/platform";
import { DEFAULT_SERVICES } from "./services";

const resolveSetupStatus = (service: ServiceItem, status?: PlatformStatusResponse | null): ServiceItem => {
    const isReady = Boolean(status?.isInitialized);
    return {
        ...service,
        badgeText: isReady ? "Inicializálva" : "Beállítás szükséges",
        badgeVariant: isReady ? 'teal' : 'orange',
        isConfigured: isReady,
        statusLabel: isReady ? "Rendszer élesítve" : "Kezdeti setup szükséges",
        statusVariant: isReady ? 'teal' : 'orange'
    };
};

const resolveFeaturesStatus = (service: ServiceItem, status?: PlatformStatusResponse | null): ServiceItem => {
    const activeFlags: Partial<Record<FeatureFlagName, boolean>> = status?.activeFeatures ?? {};
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
    } else {
        clusterLabel = "Nincs futó pod";
        clusterVariant = 'orange';
    }

    return {
        ...service,
        badgeText: totalPods > 0 ? `${totalPods} Pod (${runningPods} fut)` : (isClusterHealthy ? "0 Pod üzemel" : "Klaszter Offline"),
        badgeVariant: !isClusterHealthy ? 'vermillon' : totalPods > 0 ? 'teal' : 'orange',
        isConfigured: isClusterHealthy && totalPods > 0 && errorPods === 0,
        statusLabel: clusterLabel,
        statusVariant: clusterVariant
    };
};

const resolveConfigsStatus = (service: ServiceItem, status?: PlatformStatusResponse | null, isClusterHealthy: boolean = true): ServiceItem => {
    if (!isClusterHealthy) {
        return {
            ...service,
            badgeText: "Klaszter Offline",
            badgeVariant: 'vermillon',
            isConfigured: false,
            statusLabel: "Klaszter nem érhető el",
            statusVariant: 'vermillon'
        };
    }

    const activeFlags: Partial<Record<FeatureFlagName, boolean>> = status?.activeFeatures ?? {};
    const activeCount = Object.values(activeFlags).filter(Boolean).length;
    const totalCount = Object.keys(activeFlags).length || 7;

    return {
        ...service,
        badgeText: `${activeCount} bekapcsolt switch`,
        badgeVariant: activeCount > 0 ? 'purple' : 'orange',
        isConfigured: activeCount > 0,
        statusLabel: `${activeCount}/${totalCount} funkciókapcsoló bekapcsolva`,
        statusVariant: activeCount > 0 ? 'teal' : 'orange'
    };
};

const resolveTrafficStatus = (
    service: ServiceItem,
    status?: PlatformStatusResponse | null,
    rateLimit?: RateLimitResponseDto | null
): ServiceItem => {
    const activeFlags: Partial<Record<FeatureFlagName, boolean>> = status?.activeFeatures ?? {};
    const featureParams: Partial<Record<FeatureFlagName, Record<string, any>>> = status?.featureParams ?? {};

    const ingressRps = rateLimit?.rps && rateLimit.rps > 0 ? rateLimit.rps : undefined;
    const configRps = featureParams.rate_limiting?.rps && featureParams.rate_limiting.rps > 0 ? featureParams.rate_limiting.rps : undefined;
    const rps = ingressRps ?? configRps ?? 0;

    const isFlagActive = Boolean(activeFlags.rate_limiting);
    const isRateLimitingActive = Boolean((ingressRps && ingressRps > 0) || (isFlagActive && rps > 0) || (rateLimit?.isConfigured && rps > 0));

    return {
        ...service,
        badgeText: isRateLimitingActive && rps > 0 ? `${rps} RPS limit` : "Nincs korlát (Inaktív)",
        badgeVariant: isRateLimitingActive && rps > 0 ? 'skyblue' : 'orange',
        isConfigured: isRateLimitingActive && rps > 0,
        statusLabel: isRateLimitingActive && rps > 0 ? `Ingress védelem aktív (${rps} RPS)` : "Forgalomkorlátozás nincs beállítva",
        statusVariant: isRateLimitingActive && rps > 0 ? 'teal' : 'orange'
    };
};

const resolveAutoscalingStatus = (service: ServiceItem, status?: PlatformStatusResponse | null): ServiceItem => {
    const activeFlags: Partial<Record<FeatureFlagName, boolean>> = status?.activeFeatures ?? {};
    const featureParams: Partial<Record<FeatureFlagName, Record<string, any>>> = status?.featureParams ?? {};
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

const resolveBackupStatus = (service: ServiceItem, status?: PlatformStatusResponse | null): ServiceItem => {
    const activeFlags: Partial<Record<FeatureFlagName, boolean>> = status?.activeFeatures ?? {};
    const featureParams: Partial<Record<FeatureFlagName, Record<string, any>>> = status?.featureParams ?? {};
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

const resolveHealthStatus = (service: ServiceItem, clusterOverview?: ClusterOverviewDto | null, isClusterHealthy: boolean = true): ServiceItem => {
    const allPods = [
        ...(clusterOverview?.platformPods || []),
        ...(clusterOverview?.appPods || [])
    ];
    const totalPods = allPods.length;
    const runningPods = allPods.filter(p => p.status?.toLowerCase() === 'running').length;

    return {
        ...service,
        badgeText: !isClusterHealthy ? "Klaszter Offline" : totalPods > 0 ? `Szondák: ${runningPods}/${totalPods} OK` : "0 Pod üzemel",
        badgeVariant: isClusterHealthy && totalPods > 0 ? 'teal' : 'orange',
        isConfigured: isClusterHealthy && totalPods > 0,
        statusLabel: isClusterHealthy ? (totalPods > 0 ? "Szonda felügyelet és öngyógyítás aktív" : "Nincsenek futó podok") : "Klaszter nem érhető el",
        statusVariant: isClusterHealthy && totalPods > 0 ? 'teal' : 'orange'
    };
};

const resolveDeploymentsStatus = (service: ServiceItem, clusterOverview?: ClusterOverviewDto | null, isClusterHealthy: boolean = true): ServiceItem => {
    const appPods = clusterOverview?.appPods || [];
    const hasApp = appPods.length > 0;

    return {
        ...service,
        badgeText: !isClusterHealthy ? "Nem elérhető" : hasApp ? `Rollout (${appPods.length} Pod)` : "0 App Pod",
        badgeVariant: isClusterHealthy ? (hasApp ? 'teal' : 'orange') : 'vermillon',
        isConfigured: isClusterHealthy && hasApp,
        statusLabel: isClusterHealthy ? (hasApp ? "GitOps & Rollout üzemkész" : "Nincs aktív app pod") : "Klaszter nem érhető el",
        statusVariant: isClusterHealthy && hasApp ? 'teal' : 'orange'
    };
};

const resolveTelemetryStatus = (service: ServiceItem, isClusterHealthy: boolean): ServiceItem => ({
    ...service,
    badgeText: isClusterHealthy ? "Metrikák aktívak" : "Nem elérhető",
    badgeVariant: isClusterHealthy ? 'teal' : 'vermillon',
    isConfigured: isClusterHealthy,
    statusLabel: isClusterHealthy ? "Prometheus & Grafana kapcsolat él" : "Kapcsolat megszakadt",
    statusVariant: isClusterHealthy ? 'teal' : 'vermillon'
});

const resolveSecurityStatus = (
    service: ServiceItem,
    isClusterHealthy: boolean,
    securityOverview?: SecurityOverviewDto | null
): ServiceItem => {
    if (!isClusterHealthy) {
        return {
            ...service,
            badgeText: "Nem elérhető",
            badgeVariant: 'vermillon',
            isConfigured: false,
            statusLabel: "Klaszter kapcsolat megszakadt",
            statusVariant: 'vermillon'
        };
    }

    const cveCount = securityOverview?.vulnerabilities?.items?.length ?? 0;
    const certs = securityOverview?.tlsCertificates || [];
    const certValid = certs.length > 0 && certs[0].state === 'VALID';

    return {
        ...service,
        badgeText: cveCount === 0 ? "0 CVE (Tiszta)" : `${cveCount} sebezhetőség`,
        badgeVariant: cveCount === 0 ? 'teal' : cveCount > 3 ? 'orange' : 'teal',
        isConfigured: true,
        statusLabel: certValid ? "TLS érvényes, biztonsági audit aktív" : "Biztonsági felügyelet aktív",
        statusVariant: 'teal'
    };
};

const resolveResilienceStatus = (service: ServiceItem, isClusterHealthy: boolean): ServiceItem => ({
    ...service,
    badgeText: isClusterHealthy ? "Káosz & JMeter" : "Klaszter Offline",
    badgeVariant: isClusterHealthy ? 'purple' : 'vermillon',
    isConfigured: isClusterHealthy,
    statusLabel: isClusterHealthy ? "Reziliencia tesztelő üzemkész" : "Klaszter nem érhető el",
    statusVariant: isClusterHealthy ? 'teal' : 'vermillon'
});

const resolveDatabaseStatus = (
    service: ServiceItem,
    status?: PlatformStatusResponse | null,
    dbOverview?: DatabaseOverviewDto | null,
    isClusterHealthy: boolean = true
): ServiceItem => {
    const rawEngine = (dbOverview?.engine || status?.dbEngine || 'postgres').toLowerCase();
    const engineLabel = rawEngine === 'postgres'
        ? 'PostgreSQL HA'
        : rawEngine === 'mssql'
        ? 'MSSQL 2022'
        : rawEngine === 'oracle'
        ? 'Oracle 23c'
        : rawEngine.toUpperCase();

    const replicas = dbOverview?.replicas ?? (rawEngine === 'postgres' ? 1 : 0);
    const isOnline = isClusterHealthy && (dbOverview ? dbOverview.status === 'ONLINE' : replicas > 0);

    let badgeText = `${engineLabel} (${replicas} db)`;
    let badgeVariant: 'teal' | 'orange' | 'vermillon' = isOnline ? 'teal' : (replicas === 0 ? 'orange' : 'vermillon');
    let statusLabel = isOnline
        ? `${engineLabel} platform üzemkész (${replicas} pod)`
        : replicas === 0
        ? `${engineLabel} leállítva (0 replika)`
        : "Adatbázis nem elérhető";

    if (!isClusterHealthy) {
        badgeText = `${engineLabel} Offline`;
        badgeVariant = 'vermillon';
        statusLabel = "Klaszter nem érhető el";
    }

    return {
        ...service,
        badgeText,
        badgeVariant,
        isConfigured: isOnline && replicas > 0,
        statusLabel,
        statusVariant: isOnline && replicas > 0 ? 'teal' : 'orange'
    };
};

export interface DynamicServicesContext {
    status?: PlatformStatusResponse | null;
    clusterOverview?: ClusterOverviewDto | null;
    dbOverview?: DatabaseOverviewDto | null;
    rateLimit?: RateLimitResponseDto | null;
    securityOverview?: SecurityOverviewDto | null;
    isClusterHealthy?: boolean;
}

export const computeDynamicServices = (
    ctxOrStatus?: DynamicServicesContext | PlatformStatusResponse | null,
    clusterOverview?: ClusterOverviewDto | null,
    isClusterHealthy: boolean = true
): ServiceItem[] => {
    let status: PlatformStatusResponse | null | undefined;
    let cluster = clusterOverview;
    let isHealthy = isClusterHealthy;
    let dbOverview: DatabaseOverviewDto | null | undefined;
    let rateLimit: RateLimitResponseDto | null | undefined;
    let securityOverview: SecurityOverviewDto | null | undefined;

    if (ctxOrStatus && typeof ctxOrStatus === 'object' && ('status' in ctxOrStatus || 'clusterOverview' in ctxOrStatus || 'dbOverview' in ctxOrStatus)) {
        const ctx = ctxOrStatus as DynamicServicesContext;
        status = ctx.status;
        cluster = ctx.clusterOverview ?? clusterOverview;
        isHealthy = ctx.isClusterHealthy ?? isClusterHealthy;
        dbOverview = ctx.dbOverview;
        rateLimit = ctx.rateLimit;
        securityOverview = ctx.securityOverview;
    } else {
        status = ctxOrStatus as PlatformStatusResponse | null | undefined;
    }

    return DEFAULT_SERVICES.map(service => {
        switch (service.id) {
            case 'setup':
                return resolveSetupStatus(service, status);
            case 'features':
                return resolveFeaturesStatus(service, status);
            case 'cluster':
                return resolveClusterStatus(service, cluster, isHealthy);
            case 'configs':
                return resolveConfigsStatus(service, status, isHealthy);
            case 'traffic':
                return resolveTrafficStatus(service, status, rateLimit);
            case 'autoscaling':
                return resolveAutoscalingStatus(service, status);
            case 'backup':
                return resolveBackupStatus(service, status);
            case 'audit':
                return resolveAuditStatus(service);
            case 'events':
                return resolveEventsStatus(service, isHealthy);
            case 'health':
                return resolveHealthStatus(service, cluster, isHealthy);
            case 'deployments':
                return resolveDeploymentsStatus(service, cluster, isHealthy);
            case 'telemetry':
                return resolveTelemetryStatus(service, isHealthy);
            case 'resilience':
                return resolveResilienceStatus(service, isHealthy);
            case 'security':
                return resolveSecurityStatus(service, isHealthy, securityOverview);
            case 'database':
                return resolveDatabaseStatus(service, status, dbOverview, isHealthy);
            default:
                return service;
        }
    });
};
