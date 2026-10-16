import type { StorageMode, StorageFormData, StorageOverViewStatus } from "../types/storage";
import type { PresetItem } from "../types/component/common/presetGroupProps";
import type { BadgeProps } from "../types/component/badgeProps";
import type { SliderMark } from "../types/component/common/sliderProps";

export const STORAGE_LIMITS = {
    MIN_SIZE_GB: 1,
    MAX_SIZE_GB: 10,
    DEFAULT_SIZE_GB: 5
} as const;

export const STORAGE_SIZE_MARKS: SliderMark[] = [
    { value: 1, label: "1 GB" },
    { value: 2, label: "2 GB" },
    { value: 5, label: "5 GB" },
    { value: 8, label: "8 GB" },
    { value: 10, label: "10 GB" }
];

export const STORAGE_STATUS_BADGES: Record<StorageOverViewStatus, { text: string; variant: BadgeProps["variant"]; pulse?: boolean }> = {
    Running: {
        text: "Fut (Üzemkész)",
        variant: "teal",
        pulse: true
    },
    Stopped: {
        text: "Leállítva (0 replika)",
        variant: "neutral",
        pulse: false
    },
    Pending: {
        text: "Indítás alatt...",
        variant: "orange",
        pulse: true
    },
    Error: {
        text: "Hiba / Elérhetetlen",
        variant: "vermillon",
        pulse: false
    }
};

export const INITIAL_STORAGE_FORM: StorageFormData = {
    mode: "internal",
    internalSizeGb: 5,
    externalEndpoint: "",
    externalBucket: "",
    externalRegion: "us-east-1",
    externalAccessKey: "",
    externalSecretKey: "",
    scaleDownInternal: false
};

export const STORAGE_MODE_OPTIONS: PresetItem<StorageMode>[] = [
    {
        id: "internal",
        label: "Belső MinIO (K8s Managed)",
        description: "Gyors, helyi S3-kompatibilis objektumtároló a Kubernetes fürtben dinamikus PVC skálázással (max 10 GB).",
        badge: "Ajánlott",
        value: "internal"
    },
    {
        id: "external",
        label: "Külső Felhő S3 (AWS / R2 / GCS)",
        description: "Közvetlen felhős objektumtároló integráció egyedi hitelesítéssel és belső tároló Scale-to-Zero energiatakarékossággal.",
        badge: "Multi-Cloud",
        value: "external"
    }
];
