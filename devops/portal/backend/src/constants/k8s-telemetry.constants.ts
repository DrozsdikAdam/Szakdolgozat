import type { GrafanaDashboardDto, TelemetryTimeRange } from "../dtos/telemetry.dto.js"

export const DEFAULT_TELEMETRY_CONFIG = {
    prometheusUrl: 'http://localhost:9090',
    grafanaUrl: 'http://localhost:3001',
    scrapeIntervalSeconds: 15,
}

export const DEFAULT_GRAFANA_DASHBOARD: GrafanaDashboardDto[] = [
    {
        id: 'cluster-overview',
        title: 'Kubernetes Klaszter Áttekintés',
        description: 'Csomópontonkénti CPU, memória, lemezterület és pod eloszlás valós időben.',
        category: 'Cluster',
        embedUrl: 'http://localhost:3001/d/k8s-cluster/kubernetes-cluster-overview?kiosk=tv',
        externalUrl: 'http://localhost:3001/d/k8s-cluster/kubernetes-cluster-overview',
    },
    {
        id: 'ingress-traffic',
        title: 'NGINX Ingress & Forgalomelemzés',
        description: 'Bejövő kérésszám, p50/ p95 / p99 válaszidők és HTTP 2xx / 4xx / 5xx hibarány eloszlás.',
        category: 'Network',
        embedUrl: 'http://localhost:3001/d/nginx-ingress/nginx-ingress-controller?kiosk=tv',
        externalUrl: 'http://localhost:3001/d/nginx-ingress/nginx-ingress-controller',
    },
    {
        id: 'database-performance',
        title: 'PostgreSQL & PgBouncer Teljesítmény',
        description: 'Adatbázis kapcsolat pool kihasználtság, tranzakciós ráta és várakozási idők.',
        category: 'Database',
        embedUrl: 'http://localhost:3001/d/postgresql-ha/postgresql-and-pgbouncer?kiosk=tv',
        externalUrl: 'http://localhost:3001/d/postgresql-ha/postgresql-and-pgbouncer',
    }
]


export const TIME_RANGE_MULTIPLIERS: Record<TelemetryTimeRange, { multiplier: number, dataPoints: number }> = {
    '15m': { multiplier: 1.0, dataPoints: 15 },
    '1h': { multiplier: 1.05, dataPoints: 30 },
    '6h': { multiplier: 1.15, dataPoints: 60 },
    '24h': { multiplier: 1.25, dataPoints: 120 },
}