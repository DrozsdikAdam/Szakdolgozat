import type { ReactNode } from "react"
import type { FeatureFlagName } from "../types/platform"
import { Database, Activity, Network, Archive, Cpu, TrendingUp, AlertTriangle } from "lucide-react"

export const FeatureConfigs: Record<FeatureFlagName, {
    label: string
    description: string
    category: string
    icon: ReactNode
    isCritical?: boolean
}> = {
    rate_limiting: {
        label: "Ingress Rate Limiting",
        category: 'traffic',
        description: "NGINX Ingress szintű kérésszám-korlátozás és DoS védelem az API végpontok előtt.",
        icon: <Activity className="w-5 h-5 text-cud-skyblue" />
    },
    pgbouncer: {
        label: "PgBouncer Connection Pooling",
        category: 'database',
        description: "PostgreSQL kapcsolatgyűjtő és tranzakciós pooler az adatbázis tehermentesítésére.",
        icon: <Database className="w-5 h-5 text-cud-teal" />
    },
    haproxy: {
        label: "HAProxy Terheléselosztó",
        category: 'traffic',
        description: "Terheléselosztás és routing a replikák és mikroszolgáltatások között.",
        icon: <Network className="w-5 h-5 text-cud-skyblue" />
    },
    cronjob_backup: {
        label: "Automatikus Mentési CronJob",
        category: 'operations',
        description: "Ütemezett adatbázis és kötet snapshot mentések automatikus feltöltéssel S3/MinIO tárolóra.",
        icon: <Archive className="w-5 h-5 text-cud-teal" />
    },
    hpa_scaling: {
        label: "Horizontális Skálázás (HPA)",
        category: 'scaling',
        description: "Automatikus pod-sokszorosítás CPU és memóriaterhelés alapján (Horizontal Pod Autoscaler).",
        icon: <Cpu className="w-5 h-5 text-cud-purple" />
    },
    vpa_scaling: {
        label: "Vertikális Skálázás (VPA)",
        category: 'scaling',
        description: "Dinamikus konténer erőforrás (CPU / RAM limit és request) optimalizáció.",
        icon: <TrendingUp className="w-5 h-5 text-cud-purple" />
    },
    maintenance_mode: {
        label: "Karbantartási Üzemmód",
        category: 'operations',
        description: "Éles felhasználói forgalom azonnali átirányítása a statikus karbantartási oldalra.",
        icon: <AlertTriangle className="w-5 h-5 text-cud-vermillon" />,
        isCritical: true
    }
}