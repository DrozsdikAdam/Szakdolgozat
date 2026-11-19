import { HardDrive, FolderArchive, Globe, KeyRound, Lock, Server, ShieldCheck } from "lucide-react"
import type { SetupStepComponentProps } from "../../../types/component/setup/setupDataProps"
import type { S3Provider } from "../../../types/platform"
import type { PresetItem } from "../../../types/component/common/presetGroupProps"
import { Button } from "../../common/Button"
import { InfoCallout } from "../../common/InfoCallout"
import { PresetGroup } from "../../common/PresetGroup"
import { Input } from "../../common/Input"

const S3_PROVIDER_OPTIONS: PresetItem<S3Provider>[] = [
    {
        id: "internal",
        label: "Belső MinIO (K8s S3)",
        description: "Fürtön belüli privát S3 objektumtároló automatikus PVC kötet-lefoglalással és webes konzollal.",
        badge: "Fürtön belüli",
        value: "internal",
    },
    {
        id: "external",
        label: "Külső S3 / Cloud Storage",
        description: "AWS S3, Google Cloud Storage, Azure Blob vagy Cloudflare R2 felhőtárhely csatlakozás.",
        badge: "AWS / Cloud",
        value: "external",
    },
]

const SIZE_PRESETS: PresetItem<string>[] = [
    {
        id: "5Gi",
        label: "5 GiB",
        badge: "Alap",
        description: "Fejlesztői / Teszt",
        value: "5Gi",
    },
    {
        id: "10Gi",
        label: "10 GiB",
        badge: "Normál",
        description: "Rendszeres mentésekhez",
        value: "10Gi",
    },
    {
        id: "20Gi",
        label: "20 GiB",
        badge: "Nagy",
        description: "Gyakori mentésekhez és fájlokhoz",
        value: "20Gi",
    },
    {
        id: "50Gi",
        label: "50 GiB",
        badge: "Vállalati",
        description: "Hosszú távú megőrzéshez",
        value: "50Gi",
    },
]

export const StorageStep = ({ data, onChange, disabled }: SetupStepComponentProps) => {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div>
                    <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                        <HardDrive className="w-5 h-5 text-cud-teal" />
                        Objektumtárolás & S3 Perzisztencia
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        S3-kompatibilis adattár beállítása adatbázis-mentésekhez, fájlfeltöltésekhez és perzisztens állományokhoz.
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant={data.storageEnabled ? "primary" : "secondary"}
                        size="md"
                        onClick={() => onChange("storageEnabled", true)}
                        disabled={disabled}
                    >
                        Bekapcsolva
                    </Button>
                    <Button
                        variant={!data.storageEnabled ? "danger" : "secondary"}
                        size="md"
                        onClick={() => onChange("storageEnabled", false)}
                        disabled={disabled}
                    >
                        Kikapcsolva
                    </Button>
                </div>
            </div>

            {data.storageEnabled && (
                <div className="flex flex-col gap-6 p-5 rounded-xl bg-slate-900/60 border border-slate-800 shadow-inner">
                    <PresetGroup
                        title="S3 Szolgáltató Típusa"
                        subtitle="Válaszd ki az objektumtároló elhelyezkedését"
                        options={S3_PROVIDER_OPTIONS}
                        selectedId={data.s3Provider}
                        onSelect={(option) => onChange("s3Provider", option.value)}
                        columns={2}
                        accentColor="teal"
                        disabled={disabled}
                    />

                    <div className="pt-2 border-t border-slate-800/60 flex flex-col gap-4">
                        <Input
                            label="S3 Vödör (Bucket) Neve"
                            icon={<FolderArchive />}
                            value={data.s3Bucket}
                            onChange={(val) => onChange("s3Bucket", val)}
                            disabled={disabled}
                            placeholder="mes-backups"
                            helperText="A biztonsági adatbázis-mentések és a feltöltött fájlok tárolási azonosítója."
                            accentColor="teal"
                        />

                        <PresetGroup
                            title="Tárhely Kvótaméret (Persistent Volume Claim)"
                            subtitle="A lefoglalandó perzisztens lemezterület kapacitása"
                            options={SIZE_PRESETS}
                            selectedId={data.s3BucketSize}
                            onSelect={(option) => onChange("s3BucketSize", option.value)}
                            columns={4}
                            accentColor="skyblue"
                            disabled={disabled}
                        />
                    </div>

                    {data.s3Provider === "internal" && (
                        <div className="pt-2 border-t border-slate-800/60 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                    <Server className="w-3.5 h-3.5 text-cud-teal" />
                                    Belső MinIO Szolgáltatások (Platform-Infra)
                                </span>
                                <span className="text-[11px] px-2 py-0.5 rounded bg-cud-teal/15 text-cud-teal border border-cud-teal/30 font-medium">
                                    Automatikus K8s Kötet
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col gap-1">
                                    <span className="text-xs font-semibold text-slate-400">S3 API Belső Cím:</span>
                                    <code className="text-xs font-mono text-cud-teal break-all">
                                        http://minio.platform-infra.svc.cluster.local:9000
                                    </code>
                                </div>
                                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col gap-1">
                                    <span className="text-xs font-semibold text-slate-400">MinIO Webes Vezérlőpult (Console):</span>
                                    <code className="text-xs font-mono text-cud-skyblue break-all">
                                        http://minio.platform-infra.svc.cluster.local:9001
                                    </code>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60 mt-1">
                                <ShieldCheck className="w-4 h-4 text-cud-teal shrink-0" />
                                <span>
                                    A Kubernetes automatikusan csatolja a <code className="text-slate-300 font-mono">minio-pvc</code> perzisztens kötetet, a hitelesítési adatokat (<code className="text-slate-300 font-mono">minioadmin</code>) pedig biztonságosan K8s Secretként injektálja.
                                </span>
                            </div>
                        </div>
                    )}

                    {data.s3Provider === "external" && (
                        <div className="pt-2 border-t border-slate-800/60 flex flex-col gap-4">
                            <Input
                                label="S3 Szolgáltató Végpont URL (Endpoint)"
                                icon={<Globe />}
                                value={data.s3Endpoint ?? ""}
                                onChange={(val) => onChange("s3Endpoint", val)}
                                disabled={disabled}
                                placeholder="https://s3.eu-central-1.amazonaws.com"
                                helperText="Szabványos S3 API URL (pl. AWS, Google Cloud Storage, Cloudflare R2 vagy egyedi MinIO)."
                                accentColor="skyblue"
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Access Key ID"
                                    icon={<KeyRound />}
                                    value={data.s3AccessKey ?? ""}
                                    onChange={(val) => onChange("s3AccessKey", val)}
                                    disabled={disabled}
                                    placeholder="AKIAIOSFODNN7EXAMPLE"
                                    helperText="A felhős S3 fiókhoz tartozó nyilvános azonosító kulcs."
                                    accentColor="skyblue"
                                />

                                <Input
                                    label="Secret Access Key"
                                    icon={<Lock />}
                                    type="password"
                                    value={data.s3SecretKey ?? ""}
                                    onChange={(val) => onChange("s3SecretKey", val)}
                                    disabled={disabled}
                                    placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                                    helperText="A felhős S3 fiókhoz tartozó titkos kulcs (maszkolt beviteli mező)."
                                    accentColor="orange"
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!data.storageEnabled && (
                <div className="w-full">
                    <InfoCallout
                        title="Az S3 objektumtároló inaktív"
                        icon={<HardDrive className="w-5 h-5 text-cud-teal" />}
                    >
                        <p>
                            A rendszer perzisztens S3 tároló nélkül indul el állapotmentes módban.
                            Az automatikus adatbázis-mentések és a feltöltött fájlok nem kerülnek külső/belső S3 vödörbe mentésre.
                            Később a Vezérlőpultban bármikor aktiválhatod és konfigurálhatod.
                        </p>
                    </InfoCallout>
                </div>
            )}
        </div>
    )
}