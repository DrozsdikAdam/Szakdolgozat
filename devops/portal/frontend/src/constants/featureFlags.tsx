import type { ReactNode } from "react"
import type { FeatureFlagName } from "../types/platform"
import { Database, Activity, Network, Archive, Cpu, TrendingUp, AlertTriangle, HardDrive, Server } from "lucide-react"

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
    app_storage: {
        label: "Alkalmazás Objektumtár",
        category: 'storage',
        description: "Üzleti alkalmazás (MES) perzisztens fájl-, dokumentum- és blob tárolása (Belső MinIO vagy Külső S3 felhőtár).",
        icon: <HardDrive className="w-5 h-5 text-cud-teal" />
    },
    backup_storage: {
        label: "Mentési Tárhely",
        category: 'storage',
        description: "Adatbázis és kötet biztonsági mentések elkülönített célhelye (Belső MinIO vagy Külső S3 tároló).",
        icon: <Server className="w-5 h-5 text-cud-orange" />
    },
    cronjob_backup: {
        label: "Automatikus Mentési CronJob",
        category: 'operations',
        description: "Ütemezett adatbázis és kötet snapshot mentések automatikus feltöltéssel a kijelölt tárolóra.",
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

export const CARD_BORDER_STYLE: Record<"true" | "false", string> = {
    true: "border-cud-vermillon/60 bg-cud-vermillon/5 shadow-lg shadow-cud-vermillon/5",
    false: "border-slate-800/80 bg-slate-900/60 hover:border-slate-700/80"
}

export const CATEGORY_CONFIG: Record<
    "traffic" | "database" | "scaling" | "operations" | "storage",
    { label: string; variant: "skyblue" | "teal" | "purple" | "orange" }
> = {
    traffic: { label: "Forgalom", variant: "skyblue" },
    database: { label: "Adatbázis", variant: "teal" },
    scaling: { label: "Skálázás", variant: "purple" },
    storage: { label: "Tárhely", variant: "teal" },
    operations: { label: "Üzemeltetés", variant: "orange" }
}

export const NAVIGATION_TARGETS: Partial<Record<FeatureFlagName, { target: string; label: string }>> = {
    rate_limiting: { target: "traffic", label: "Beállítások a Forgalom oldalon" },
    app_storage: { target: "storage", label: "Tárhely áttekintés" },
    backup_storage: { target: "storage", label: "Tárhely áttekintés" },
    hpa_scaling: { target: "autoscaling", label: "Finomhangolás a Skálázás oldalon" },
    vpa_scaling: { target: "autoscaling", label: "Finomhangolás a Skálázás oldalon" },
    cronjob_backup: { target: "database", label: "Mentési napló az Adatbázis oldalon" }
}

export const CATEGORY_TABS: { id: "all" | "traffic" | "database" | "scaling" | "storage" | "operations"; label: string }[] = [
    { id: "all", label: "Összes" },
    { id: "traffic", label: "Forgalom" },
    { id: "database", label: "Adatbázis" },
    { id: "scaling", label: "Skálázás" },
    { id: "storage", label: "Tárhely" },
    { id: "operations", label: "Üzemeltetés" }
]

export const INACTIVATION_PRESETS = [
    {
        id: "scale_to_zero",
        label: "Scale-to-Zero",
        badge: "0 Pod / 0 MB RAM",
        description: "Inaktív állapotban a podok 0 példányra állnak le (0 MB RAM / 0 CPU). Reaktiváláskor hidegindítás (~5-10 mp).",
        value: "scale_to_zero" as const
    },
    {
        id: "hot_standby",
        label: "Hot-Standby",
        badge: "1 Pod / 0s késleltetés",
        description: "1 minimális replika folyamatosan fut (alacsony RAM), azonnali válaszidő reaktiváláskor.",
        value: "hot_standby" as const
    }
]