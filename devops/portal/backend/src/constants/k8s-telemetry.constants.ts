import type { GrafanaDashboardDto, TelemetryTimeRange } from "../dtos/telemetry.dto.js"

export const DEFAULT_TELEMETRY_CONFIG = {
    prometheusUrl: 'http://localhost:9090',
    grafanaUrl: 'http://localhost:3001',
    scrapeIntervalSeconds: 15,
}

export const DEFAULT_GRAFANA_DASHBOARD: GrafanaDashboardDto[] = [
    {
        id: 'cluster-overview',
        title: 'Kubernetes Klaszter',
        description: 'Csomópontonkénti CPU, memória, lemezterület és pod eloszlás valós időben.',
        category: 'Cluster',
        embedUrl: 'http://localhost:3001/d/k8s-cluster?kiosk=tv',
        externalUrl: 'http://localhost:3001/d/k8s-cluster',
    },
    {
        id: 'ingress-traffic',
        title: 'NGINX Ingress Forgalom',
        description: 'Éles üzemű L7 RED telemetria: HTTP kérésszám (RPS), hibakódok (2xx/3xx/4xx/5xx), p99 válaszidők és SSL állapot.',
        category: 'Network',
        embedUrl: 'http://localhost:3001/d/nginx-ingress-l7?kiosk=tv',
        externalUrl: 'http://localhost:3001/d/nginx-ingress-l7',
    },
    {
        id: 'database-performance',
        title: 'PostgreSQL & PgBouncer',
        description: 'Adatbázis kapcsolat pool kihasználtság, tranzakciós ráta és várakozási idők.',
        category: 'Database',
        embedUrl: 'http://localhost:3001/d/postgresql-ha?kiosk=tv',
        externalUrl: 'http://localhost:3001/d/postgresql-ha',
    }
]


export const TIME_RANGE_MULTIPLIERS: Record<TelemetryTimeRange, { multiplier: number, dataPoints: number }> = {
    '15m': { multiplier: 1.0, dataPoints: 15 },
    '1h': { multiplier: 1.05, dataPoints: 30 },
    '6h': { multiplier: 1.15, dataPoints: 60 },
    '24h': { multiplier: 1.25, dataPoints: 120 },
}