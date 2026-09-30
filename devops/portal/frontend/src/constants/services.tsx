import { Activity, Archive, Cpu, HeartPulse, KeyRound, LineChart, Rocket, Server, Shield, ShieldAlert, Terminal, ToggleRight, Wrench } from "lucide-react";
import type { ServiceItem } from "../types/component/hub";

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
        id: 'configs',
        accentColor: 'teal',
        label: "Környezeti Változók & Titkok",
        description: "Kubernetes ConfigMaps és Secrets böngészése, biztonságos feloldása és workload újraindítások.",
        iconName: <KeyRound className="w-6 h-6" />,
        badgeText: "Config & Secrets",
        badgeVariant: 'teal',
        isConfigured: true,
        statusLabel: "Konfigurációkezelő aktív",
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
    },
    {
        id: 'health',
        accentColor: 'teal',
        label: "Egészségellenőrzés & Szondák",
        description: "Konténer Startup, Liveness és Readiness szondák felügyelete, finomhangolása és élő tesztelése.",
        iconName: <HeartPulse className="w-6 h-6" />,
        badgeText: "Szondák aktívak",
        badgeVariant: 'teal',
        isConfigured: true,
        statusLabel: "Szonda felügyelet aktív",
        statusVariant: 'teal'
    },
    {
        id: 'deployments',
        accentColor: 'orange',
        label: "Telepítések & GitOps",
        description: "Deklaratív GitOps szinkronizáció, automatikus Self-Heal és rollout stratégiák (Rolling, Blue/Green, Canary).",
        iconName: <Rocket className="w-6 h-6" />,
        badgeText: "GitOps aktív",
        badgeVariant: 'orange',
        isConfigured: true,
        statusLabel: "Rollout és visszaállítás kész",
        statusVariant: 'teal'
    },
    {
        id: 'telemetry',
        accentColor: 'skyblue',
        label: "Megfigyelhetőség & Metrikák",
        description: "Prometheus és Grafana telemetria, Golden Signals, erőforrás metrikák és beágyazott dashboardok.",
        iconName: <LineChart className="w-6 h-6" />,
        badgeText: "Prometheus & Grafana",
        badgeVariant: 'skyblue',
        isConfigured: true,
        statusLabel: "Telemetria adatgyűjtés aktív",
        statusVariant: 'teal'
    },
    {
        id: 'security',
        accentColor: 'teal',
        label: "Biztonság",
        description: "Nyelvi auditok, runtime frissítések és titkosítás.",
        iconName: <Shield className="w-6 h-6" />,
        badgeText: "Biztonsági modul",
        badgeVariant: 'orange',
        isConfigured: true,
        statusLabel: "Biztonsági monitoring üzemkész",
        statusVariant: 'teal'
    }
];
