import { useState, useEffect, useMemo, useCallback } from "react";
import { PlatformApi } from "../client/api/platform";
import type { FeatureFlagName, InactivationStrategy } from "../types/platform";
import type { FeatureMetaItem, FeatureCategory } from "../types/component/features/featureCardProps";
import { FeatureConfigs } from "../constants/featureFlags";

export const ALL_FEATURES: FeatureMetaItem[] = (Object.keys(FeatureConfigs) as FeatureFlagName[]).map(
    (key) => ({
        key,
        label: FeatureConfigs[key].label,
        description: FeatureConfigs[key].description,
        category: FeatureConfigs[key].category as FeatureCategory,
        icon: FeatureConfigs[key].icon,
        isCritical: FeatureConfigs[key].isCritical
    })
);

export const useFeatureFlags = () => {
    const [flags, setFlags] = useState<Record<FeatureFlagName, boolean>>({
        rate_limiting: false,
        pgbouncer: false,
        haproxy: false,
        cronjob_backup: false,
        hpa_scaling: false,
        vpa_scaling: false,
        maintenance_mode: false
    });
    const [featureParams, setFeatureParams] = useState<Partial<Record<FeatureFlagName, Record<string, any>>>>({});
    const [inactivationStrategy, setInactivationStrategy] = useState<InactivationStrategy>("scale_to_zero");
    const [loading, setLoading] = useState<boolean>(true);
    const [togglingKey, setTogglingKey] = useState<FeatureFlagName | null>(null);
    const [search, setSearch] = useState<string>("");
    const [selectedCategory, setSelectedCategory] = useState<"all" | FeatureCategory>("all");
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const platformApi = useMemo(() => new PlatformApi(), []);

    const isCardToggling = useCallback((key: FeatureFlagName) => {
        if (togglingKey === key) return true;
        if ((key === 'hpa_scaling' || key === 'vpa_scaling') && (togglingKey === 'hpa_scaling' || togglingKey === 'vpa_scaling')) {
            return true;
        }
        return false;
    }, [togglingKey]);

    const loadPlatformStatus = useCallback(async () => {
        try {
            const res = await platformApi.getStatus();
            if (res.activeFeatures)
                setFlags(res.activeFeatures);
            if (res.featureParams)
                setFeatureParams(res.featureParams);
            if (res.inactivationStrategy)
                setInactivationStrategy(res.inactivationStrategy);
            setLastUpdated(new Date());
        } catch (err) {
            console.warn("Nem sikerült lekérni a platform státuszt:", err);
        } finally {
            setLoading(false);
        }
    }, [platformApi]);

    useEffect(() => {
        setLoading(true);
        loadPlatformStatus();
    }, [loadPlatformStatus]);

    const handleToggle = async (key: FeatureFlagName, nextState: boolean) => {
        if (togglingKey) return;

        setTogglingKey(key);

        setFlags((prev) => {
            const updated = { ...prev, [key]: nextState };
            if (key === 'hpa_scaling' && nextState) updated.vpa_scaling = false;
            else if (key === 'vpa_scaling' && nextState) updated.hpa_scaling = false;
            return updated;
        });

        try {
            await platformApi.toggleFeature({
                name: key,
                enabled: nextState,
                strategy: inactivationStrategy
            });
            await loadPlatformStatus();
        } catch (err) {
            console.error("Hiba a feature flag módosításakor:", err);
            await loadPlatformStatus();
        } finally {
            setTogglingKey(null);
        }
    };

    const filteredFeatures = useMemo(() => {
        return ALL_FEATURES.filter((item) => {
            const matchesCategory =
                selectedCategory === "all" || item.category === selectedCategory;
            const matchesSearch =
                item.label.toLowerCase().includes(search.toLowerCase()) ||
                item.description.toLowerCase().includes(search.toLowerCase());

            return matchesCategory && matchesSearch;
        });
    }, [search, selectedCategory]);

    const activeCount = useMemo(() => {
        return Object.values(flags).filter(Boolean).length;
    }, [flags]);

    const maintenanceActive = Boolean(flags.maintenance_mode);

    return {
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
    };
};
