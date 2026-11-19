import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import type { ConfigsTabProps, ConfigsSubTab } from "../types/configsTab";
import { CONFIGS_TAB_OPTIONS } from "../constants/configsTab";
import { SegmentedControl } from "../components/common/SegmentedControl";
import { FlagsTab } from "./FlagsTab";
import { ConfigTab } from "./ConfigTab";
import { SetupTab } from "./SetupTab";
import { Sliders } from "lucide-react";

export const ConfigsTab = ({ initialTab = "features", onNavigate }: ConfigsTabProps) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const queryTab = searchParams.get("tab") as ConfigsSubTab | "setup" | null;
    const resolvedInitialTab: ConfigsSubTab = queryTab === "setup" ? "wizard" : (queryTab || initialTab);

    const [activeTab, setActiveTab] = useState<ConfigsSubTab>(resolvedInitialTab);

    const handleTabChange = useCallback((tab: ConfigsSubTab) => {
        setActiveTab(tab);
        setSearchParams({ tab });
    }, [setSearchParams]);

    useEffect(() => {
        if (queryTab) {
            if (queryTab === "setup" || queryTab === "wizard") {
                setActiveTab("wizard");
            } else if (queryTab === "config") {
                setActiveTab("config");
            } else if (queryTab === "features") {
                setActiveTab("features");
            }
        }
    }, [queryTab]);

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-cud-purple-bg border border-cud-purple-border text-cud-purple">
                        <Sliders className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            Konfigurációk & Funkciókapcsolók
                        </h1>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Feature flag vezérlés, K8s ConfigMaps & Secrets szerkesztő és Rendszer Varázsló egy felületen.
                        </p>
                    </div>
                </div>

                <SegmentedControl<ConfigsSubTab>
                    value={activeTab}
                    onChange={handleTabChange}
                    options={CONFIGS_TAB_OPTIONS}
                    layout="pill"
                />
            </div>

            {activeTab === "features" && (
                <FlagsTab onNavigate={onNavigate} />
            )}

            {activeTab === "config" && (
                <ConfigTab />
            )}

            {activeTab === "wizard" && (
                <SetupTab onComplete={() => setActiveTab("features")} />
            )}
        </div>
    );
};
