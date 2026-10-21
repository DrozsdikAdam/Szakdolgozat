import { HardDrive, AlertTriangle } from "lucide-react";
import type { StorageModeSelectorCardProps } from "../../../types/component/storage/storageModeSelectorCardProps";
import { Card } from "../../common/Card";
import { PresetGroup } from "../../common/PresetGroup";
import { Toggle } from "../../common/Toggle";
import { STORAGE_MODE_OPTIONS } from "../../../constants/storage";

export const StorageModeSelectorCard = ({
    selectedMode,
    onModeChange,
    disabled = false,
    appStorageEnabled = true,
    onToggleAppStorage,
    isToggling = false
}: StorageModeSelectorCardProps) => {
    return (
        <Card
            title="Objektumtár Architektúra és Helyszín"
            subtitle="Válassz a platform által vezérelt belső MinIO szolgáltatás vagy külső felhős S3 tároló (AWS S3, Cloudflare R2, GCP) között."
            action={
                onToggleAppStorage && (
                    <div className="flex items-center gap-2.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            appStorageEnabled
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}>
                            {appStorageEnabled ? "Tárhely Aktív (Fut)" : "Tárhely Inaktív (0 Pod)"}
                        </span>
                        <Toggle
                            checked={Boolean(appStorageEnabled)}
                            loading={isToggling}
                            onChange={onToggleAppStorage}
                            ariaLabel="Alkalmazás Fájltár Ki/Be kapcsolása"
                        />
                    </div>
                )
            }
            className="flex flex-col gap-6"
        >
            {!appStorageEnabled && (
                <div className="p-3 rounded-xl bg-cud-orange/10 border border-cud-orange/30 text-cud-orange flex items-center gap-2.5 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Az alkalmazás objektumtár szolgáltatás inaktív állapotban van. Bekapcsoláshoz használd a jobb felső kapcsolót!</span>
                </div>
            )}

            <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-cud-teal" />
                    Tárolási Megoldás
                </label>
                <PresetGroup
                    options={STORAGE_MODE_OPTIONS}
                    selectedId={selectedMode}
                    onSelect={(opt) => onModeChange(opt.value)}
                    columns={2}
                    accentColor="teal"
                    disabled={disabled}
                />
            </div>
        </Card>
    );
};
