import { useState, useEffect, useMemo } from "react"
import { RefreshCw, Sliders, Search } from "lucide-react"
import { PlatformApi } from "../client/api/platform"
import type { FeatureFlagName } from "../types/platform"
import type { FeatureMetaItem, FeatureCategory } from "../types/component/features/featureCardProps"
import { FeatureConfigs } from "../constants/featureFlags"
import { FeatureStats } from "../components/dashboard/features/Stats"
import { FeatureCard } from "../components/dashboard/features/Card"
import { SearchInput } from "../components/common/SearchInput"
import { Button } from "../components/common/Button"
import { EmptyState } from "../components/common/EmptyState"

const ALL_FEATURES: FeatureMetaItem[] = (Object.keys(FeatureConfigs) as FeatureFlagName[]).map(
    (key) => ({
        key,
        label: FeatureConfigs[key].label,
        description: FeatureConfigs[key].description,
        category: FeatureConfigs[key].category as FeatureCategory,
        icon: FeatureConfigs[key].icon,
        isCritical: FeatureConfigs[key].isCritical
    })
)

const CATEGORY_TABS: { id: "all" | FeatureCategory; label: string }[] = [
    { id: "all", label: "Összes" },
    { id: "traffic", label: "Forgalom" },
    { id: "database", label: "Adatbázis" },
    { id: "scaling", label: "Skálázás" },
    { id: "operations", label: "Üzemeltetés" }
]

export const FlagsTab = () => {
    const [flags, setFlags] = useState<Record<FeatureFlagName, boolean>>({
        rate_limiting: false,
        pgbouncer: false,
        haproxy: false,
        cronjob_backup: false,
        hpa_scaling: false,
        vpa_scaling: false,
        maintenance_mode: false
    })
    const [loading, setLoading] = useState<boolean>(true)
    const [togglingKey, setTogglingKey] = useState<FeatureFlagName | null>(null)
    const [search, setSearch] = useState<string>("")
    const [selectedCategory, setSelectedCategory] = useState<"all" | FeatureCategory>("all")
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

    const loadPlatformStatus = () => {
        setLoading(true)
        new PlatformApi()
            .getStatus()
            .then((res) => {
                if (res.activeFeatures)
                    setFlags(res.activeFeatures)
                setLastUpdated(new Date())
            })
            .catch((err) => {
                console.warn("Nem sikerült lekérni a platform státuszt:", err)
            })
            .finally(() => {
                setLoading(false)
            })
    }

    useEffect(() => {
        loadPlatformStatus()
    }, [])

    const handleToggle = async (key: FeatureFlagName, nextState: boolean) => {
        setTogglingKey(key)
        setFlags((prev) => ({ ...prev, [key]: nextState }))

        try {
            await new PlatformApi().toggleFeature({
                name: key,
                enabled: nextState
            })
        } catch (err) {
            console.error("Hiba a feature flag módosításakor:", err)
            setFlags((prev) => ({ ...prev, [key]: !nextState }))
        } finally {
            setTogglingKey(null)
        }
    }

    const filteredFeatures = useMemo(() => {
        return ALL_FEATURES.filter((item) => {
            const matchesCategory =
                selectedCategory === "all" || item.category === selectedCategory
            const matchesSearch =
                item.label.toLowerCase().includes(search.toLowerCase()) ||
                item.description.toLowerCase().includes(search.toLowerCase())

            return matchesCategory && matchesSearch
        })
    }, [search, selectedCategory])

    const activeCount = useMemo(() => {
        return Object.values(flags).filter(Boolean).length
    }, [flags])

    const maintenanceActive = Boolean(flags.maintenance_mode)

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
                        <Sliders className="w-6 h-6 text-cud-orange" />
                        Funkciókapcsolók (Feature Flags)
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                        Platform komponensek és üzemeltetési modulok futásidejű, azonnali vezérlése.
                        {lastUpdated && (
                            <span className="text-xs text-slate-500 ml-2">
                                (Utolsó szinkronizáció: {lastUpdated.toLocaleTimeString()})
                            </span>
                        )}
                    </p>
                </div>

                <Button
                    variant="secondary"
                    size="sm"
                    loading={loading}
                    icon={<RefreshCw className="w-4 h-4" />}
                    onClick={loadPlatformStatus}
                >
                    Állapotok frissítése
                </Button>
            </div>

            <FeatureStats
                totalCount={ALL_FEATURES.length}
                activeCount={activeCount}
                maintenanceActive={maintenanceActive}
            />

            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Funkció keresése név vagy leírás alapján..."
                    className="w-full md:w-80"
                />

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                    {CATEGORY_TABS.map((tab) => {
                        const isSelected = selectedCategory === tab.id
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setSelectedCategory(tab.id)}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${isSelected
                                    ? "bg-cud-skyblue text-slate-950 font-semibold shadow-sm"
                                    : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            {filteredFeatures.length === 0 ? (
                <EmptyState
                    icon={<Search className="w-6 h-6" />}
                    title="Nincs találat a megadott feltételekkel"
                    description="Próbáld meg módosítani a keresőszót vagy válassz másik kategóriát!"
                />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredFeatures.map((feature) => (
                        <FeatureCard
                            key={feature.key}
                            feature={feature}
                            enabled={Boolean(flags[feature.key])}
                            isToggling={togglingKey === feature.key}
                            onToggle={handleToggle}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
