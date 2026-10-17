import { HardDrive } from "lucide-react";
import type { StorageModeSelectorCardProps } from "../../../types/component/storage/storageModeSelectorCardProps";
import { Card } from "../../common/Card";
import { PresetGroup } from "../../common/PresetGroup";
import { STORAGE_MODE_OPTIONS } from "../../../constants/storage";

export const StorageModeSelectorCard = ({ selectedMode, onModeChange, disabled = false }: StorageModeSelectorCardProps) => {
    return (
        <Card
            title="Objektumtár Architektúra és Helyszín"
            subtitle="Válassz a platform által vezérelt belső MinIO szolgáltatás vagy külső felhős S3 tároló (AWS S3, Cloudflare R2, GCP) között."
            className="flex flex-col gap-6"
        >
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
