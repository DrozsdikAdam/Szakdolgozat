import { Database, Server } from "lucide-react";
import type { EngineSelectorCardProps } from "../../../types/component/database/engineSelectorCardProps";
import { Card } from "../../common/Card";
import { PresetGroup } from "../../common/PresetGroup";
import { DB_ENGINE_OPTIONS, DB_MODE_OPTIONS } from "../../../constants/database";

export const EngineSelectorCard = ({
    selectedEngine,
    selectedMode,
    onEngineChange,
    onModeChange,
    disabled = false
}: EngineSelectorCardProps) => {
    return (
        <Card
            title="Adatbázis Motor és Topológia"
            subtitle="Válassz a platform által felügyelt belső magas rendelkezésre állású konténerek vagy külső felhős adatbázisok közül."
            className="flex flex-col gap-6"
        >
            <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                        <Database className="w-4 h-4 text-cud-teal" />
                        Relációs Adatbázis Motor
                    </label>
                    <PresetGroup
                        options={DB_ENGINE_OPTIONS}
                        selectedId={selectedEngine}
                        onSelect={(opt) => onEngineChange(opt.value)}
                        columns={3}
                        accentColor="teal"
                        disabled={disabled}
                    />
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
                    <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                        <Server className="w-4 h-4 text-cud-skyblue" />
                        Üzemeltetési Mód
                    </label>
                    <PresetGroup
                        options={DB_MODE_OPTIONS}
                        selectedId={selectedMode}
                        onSelect={(opt) => onModeChange(opt.value)}
                        columns={2}
                        accentColor="skyblue"
                        disabled={disabled}
                    />
                </div>
            </div>
        </Card>
    );
};
