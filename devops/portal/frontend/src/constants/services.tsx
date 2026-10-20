import { Activity, Database, HeartPulse, Rocket, Server, Shield, Sliders, Zap } from "lucide-react";
import type { ServiceItem } from "../types/component/hub";

export const DEFAULT_SERVICES: ServiceItem[] = [
    {
        id: 'cluster',
        accentColor: 'skyblue',
        label: "Klaszter & Munkamenetek",
        description: "Kubernetes pod állapotok, élő konténer naplók (log streamer) és klaszter életesemények valós időben.",
        iconName: <Server className="w-6 h-6" />,
        badgeText: "Kapcsolódás...",
        badgeVariant: 'orange',
        isConfigured: false,
        statusLabel: "Klaszter állapot lekérdezése...",
        statusVariant: 'orange'
    },
    {
        id: 'traffic',
        accentColor: 'skyblue',
        label: "Forgalom & Skálázás",
        description: "NGINX Ingress kérés-korlátozás (RPS), terhelésalapú horizontális (HPA) és vertikális (VPA) skálázás.",
        iconName: <Activity className="w-6 h-6" />,
        badgeText: "Nincs korlát (Inaktív)",
        badgeVariant: 'orange',
        isConfigured: false,
        statusLabel: "Forgalomkorlátozás nincs beállítva",
        statusVariant: 'orange'
    },
    {
        id: 'database',
        accentColor: 'teal',
        label: "Adattárház & Katasztrófa-helyreállítás",
        description: "PostgreSQL HA, MSSQL és Oracle adatbázisok, Zero-Downtime migráció és S3/MinIO biztonsági mentések.",
        iconName: <Database className="w-6 h-6" />,
        badgeText: "Adatbázis lekérése...",
        badgeVariant: 'orange',
        isConfigured: false,
        statusLabel: "Adatbázis kapcsolat ellenőrzése...",
        statusVariant: 'orange'
    },
    {
        id: 'security',
        accentColor: 'teal',
        label: "Biztonság & Megfelelőség",
        description: "Trivy CVE konténer vizsgálat, TLS tanúsítványok, jelszórotáció és részletes műveleti audit naplózás.",
        iconName: <Shield className="w-6 h-6" />,
        badgeText: "Biztonság...",
        badgeVariant: 'orange',
        isConfigured: false,
        statusLabel: "Biztonsági állapot lekérdezése...",
        statusVariant: 'orange'
    },
    {
        id: 'configs',
        accentColor: 'purple',
        label: "Konfigurációk & Funkciókapcsolók",
        description: "Futásidejű Feature Flag vezérlés, K8s ConfigMaps & Secrets szerkesztő és 6-lépéses Rendszer Varázsló.",
        iconName: <Sliders className="w-6 h-6" />,
        badgeText: "0 bekapcsolt switch",
        badgeVariant: 'purple',
        isConfigured: false,
        statusLabel: "0/7 funkciókapcsoló bekapcsolva",
        statusVariant: 'orange'
    },
    {
        id: 'deployments',
        accentColor: 'orange',
        label: "Telepítések & GitOps",
        description: "Deklaratív Git szinkronizáció, automatikus Self-Heal és rollout stratégiák (RollingUpdate, Blue/Green, Canary).",
        iconName: <Rocket className="w-6 h-6" />,
        badgeText: "GitOps Rollout",
        badgeVariant: 'orange',
        isConfigured: false,
        statusLabel: "Rollout adatok lekérése...",
        statusVariant: 'orange'
    },
    {
        id: 'health',
        accentColor: 'teal',
        label: "Egészségellenőrzés & Szondák",
        description: "Startup, Liveness és Readiness szondák monitorozása, finomhangolása és valós idejű HTTP ping tesztelés.",
        iconName: <HeartPulse className="w-6 h-6" />,
        badgeText: "Szondák...",
        badgeVariant: 'teal',
        isConfigured: false,
        statusLabel: "Szonda állapot lekérdezése...",
        statusVariant: 'orange'
    },
    {
        id: 'resilience',
        accentColor: 'purple',
        label: "Reziliencia & Megfigyelhetőség",
        description: "Pod-Kill káoszkísérletek (RTO mérés), Apache JMeter terheléstesztek és NGINX hálózati hibainjektálás.",
        iconName: <Zap className="w-6 h-6" />,
        badgeText: "Káosz & Telemetria",
        badgeVariant: 'purple',
        isConfigured: false,
        statusLabel: "Reziliencia állapot lekérdezése...",
        statusVariant: 'orange'
    }
];

export const HOVER_ACCENT_STYLES: Record<string, string> = {
    teal: "hover:border-cud-teal-border hover:shadow-[0_0_20px_var(--cud-teal-bg)]",
    vermillon: "hover:border-cud-vermillon-border hover:shadow-[0_0_20px_var(--cud-vermillon-bg)]",
    orange: "hover:border-cud-orange-border hover:shadow-[0_0_20px_var(--cud-orange-bg)]",
    skyblue: "hover:border-cud-skyblue-border hover:shadow-[0_0_20px_var(--cud-skyblue-bg)]",
    purple: "hover:border-cud-purple-border hover:shadow-[0_0_20px_var(--cud-purple-bg)]"
};
