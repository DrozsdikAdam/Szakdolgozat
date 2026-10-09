import { RefreshCw, Sliders, Search, AlertTriangle } from "lucide-react";
import { useFeatureFlags, ALL_FEATURES } from "../hooks/useFeatureFlags";
import type { InactivationStrategy } from "../types/platform";
import { CATEGORY_TABS, INACTIVATION_PRESETS } from "../constants/featureFlags";
import { FeatureStats } from "../components/dashboard/features/Stats";
import { FeatureCard } from "../components/dashboard/features/Card";
import { PresetGroup } from "../components/common/PresetGroup";
import { SearchInput } from "../components/common/SearchInput";
import { Button } from "../components/common/Button";
import { EmptyState } from "../components/common/EmptyState";

interface FlagsTabProps {
    onNavigate?: (serviceId: any) => void;
}

export const FlagsTab = ({ onNavigate }: FlagsTabProps) => {
    const {
        flags,
        featureParams,
        inactivationStrategy,
        setInactivationStrategy,
        loading,
        search,
        setSearch,
        selectedCategory,
        setSelectedCategory,
        lastUpdated,
        isCardToggling,
        loadPlatformStatus,
        handleToggle,
        filteredFeatures,
        activeCount,
        maintenanceActive
    } = useFeatureFlags();

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

            {maintenanceActive && (
                <div className="p-4 rounded-xl bg-cud-vermillon/10 border border-cud-vermillon/40 text-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-cud-vermillon/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-cud-vermillon/20 text-cud-vermillon shrink-0">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-cud-vermillon flex items-center gap-2">
                                Karbantartási Üzemmód Aktív!
                            </h4>
                            <p className="text-xs text-slate-300 mt-0.5">
                                A felhasználói forgalom át van irányítva az 503-as statikus karbantartási oldalra. A mikroszolgáltatások közvetlen elérése korlátozva van.
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleToggle("maintenance_mode", false)}
                        className="shrink-0 border-cud-vermillon/40 hover:bg-cud-vermillon/20 text-xs"
                    >
                        Karbantartás feloldása
                    </Button>
                </div>
            )}

            <PresetGroup<InactivationStrategy>
                title="Kikapcsolási & Inaktiválási Stratégia"
                subtitle="K8s FinOps Workload Profilok"
                columns={2}
                accentColor={inactivationStrategy === "scale_to_zero" ? "teal" : "skyblue"}
                options={INACTIVATION_PRESETS}
                selectedId={inactivationStrategy}
                onSelect={(preset) => setInactivationStrategy(preset.value)}
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
                        const isSelected = selectedCategory === tab.id;
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
                        );
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
                            isToggling={isCardToggling(feature.key)}
                            strategy={inactivationStrategy}
                            params={featureParams[feature.key]}
                            onNavigate={onNavigate}
                            onToggle={handleToggle}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
