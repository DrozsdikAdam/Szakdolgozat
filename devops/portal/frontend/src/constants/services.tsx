import { Activity, Archive, Cpu, Server, ShieldAlert, ToggleRight, Wrench } from "lucide-react";
import type { ServiceItem } from "../types/component/hub";

export const DEFAULT_SERVICES: ServiceItem[] = [
    {
        id: 'cluster',
        accentColor: 'teal',
        label: "Klaszter és Podok",
        description: "Kubernetes workloadok, pod állapotok és újraindítások valós idejű monitorozása.",
        iconName: <Server className="w-6 h-6" />,
        badgeText: "Klaszter aktív",
        badgeVariant: 'teal',
        isConfigured: true
    },
    {
        id: 'traffic',
        accentColor: 'skyblue',
        label: "Forgalom és Rate Limiting",
        description: "NGINX Ingress kérés-szabályozás és RPS sávszélesség korlátozás valós időben.",
        iconName: <Activity className="w-6 h-6" />,
        badgeText: "100 rps limit",
        badgeVariant: 'skyblue',
        isConfigured: true
    },
    {
        id: 'autoscaling',
        accentColor: 'purple',
        label: "Automatikus Skálázás (HPA / VPA)",
        description: "Horizontális pod autoscaling (terhelésalapú) és vertikális erőforrás-ajánlások.",
        iconName: <Cpu className="w-6 h-6" />,
        badgeText: "2 - 10 Pod skála",
        badgeVariant: 'purple',
        isConfigured: true
    },
    {
        id: 'backup',
        accentColor: 'teal',
        label: "Mentések és Visszaállítás",
        description: "Katasztrófa-helyreállítási pillanatképek, K8s CronJob mentések és snapshot visszatöltés.",
        iconName: <Archive className="w-6 h-6" />,
        badgeText: "Mentések aktívak",
        badgeVariant: 'teal',
        isConfigured: true
    },
    {
        id: 'features',
        accentColor: 'orange',
        label: "Funkciókapcsolók (Feature Flags)",
        description: "Platform modulok (PgBouncer, HAProxy, Karbantartási mód) dinamikus kapcsolása.",
        iconName: <ToggleRight className="w-6 h-6" />,
        badgeText: "7 aktív flag",
        badgeVariant: 'orange',
        isConfigured: true
    },
    {
        id: 'audit',
        accentColor: 'purple',
        label: "Audit és Biztonsági Naplók",
        description: "Rendszerkonfigurációs módosítások és biztonsági események visszakövetése.",
        iconName: <ShieldAlert className="w-6 h-6" />,
        badgeText: "Audit naplózás",
        badgeVariant: 'purple',
        isConfigured: true
    },
    {
        id: 'setup',
        accentColor: 'teal',
        label: "Rendszer Inicializálás (Setup)",
        description: "GitOps repository, PostgreSQL adatbázis és tároló réteg beállítása és ellenőrzése.",
        iconName: <Wrench className="w-6 h-6" />,
        badgeText: "Inicializálva",
        badgeVariant: 'teal',
        isConfigured: true
    }
]