import { GitPullRequest, GitBranch, Globe, Lock, KeyRound } from "lucide-react"
import type { DeploymentStrategy, SetupStepComponentProps } from "../../../types/component/setup/setupDataProps"
import type { GitProvider } from "../../../types/platform"
import type { PresetItem } from "../../../types/component/common/presetGroupProps"
import { InfoCallout } from "../../common/InfoCallout"
import { Button } from "../../common/Button"
import { PresetGroup } from "../../common/PresetGroup"
import { Input } from "../../common/Input"

const GIT_PROVIDER_OPTIONS: PresetItem<GitProvider>[] = [
    {
        id: "GITHUB",
        label: "GitHub",
        description: "GitHub.com felhő vagy Enterprise környezet",
        badge: "Cloud",
        value: "GITHUB",
    },
    {
        id: "GITLAB",
        label: "GitLab",
        description: "GitLab.com vagy önállóan üzemeltetett szerver",
        badge: "Self-hosted",
        value: "GITLAB",
    },
]

const STRATEGY_OPTIONS: PresetItem<DeploymentStrategy>[] = [
    {
        id: "RollingUpdate",
        label: "RollingUpdate",
        description: "Fokozatos csere, garantált 0 leállási idő (K8s alapértelmezett)",
        badge: "Ajánlott",
        value: "RollingUpdate",
    },
    {
        id: "BlueGreen",
        label: "Blue / Green",
        description: "Két független verzió fut párhuzamosan, azonnali átkapcsolás",
        badge: "Biztonságos",
        value: "BlueGreen",
    },
    {
        id: "Canary",
        label: "Canary",
        description: "Fokozatos forgalom-átirányítás (pl. 10% tesztelés, majd 100%)",
        badge: "Haladó",
        value: "Canary",
    },
]

export const GitStep = ({ data, onChange, disabled }: SetupStepComponentProps) => {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div>
                    <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                        <GitPullRequest className="w-5 h-5 text-cud-teal" />
                        GitOps & Forráskód Integráció
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        Automatikus szinkronizáció és folyamatos telepítés közvetlenül Git repository-ból.
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant={data.gitEnabled ? "primary" : "secondary"}
                        size="md"
                        onClick={() => onChange("gitEnabled", true)}
                        disabled={disabled}
                    >
                        Bekapcsolva
                    </Button>
                    <Button
                        variant={!data.gitEnabled ? "danger" : "secondary"}
                        size="md"
                        onClick={() => onChange("gitEnabled", false)}
                        disabled={disabled}
                    >
                        Kikapcsolva
                    </Button>
                </div>
            </div>

            {data.gitEnabled && (
                <div className="flex flex-col gap-6 p-5 rounded-xl bg-slate-900/60 border border-slate-800 shadow-inner">
                    <PresetGroup
                        title="Git Szolgáltató"
                        subtitle="Válaszd ki a forráskód-tárhely típusát"
                        options={GIT_PROVIDER_OPTIONS}
                        selectedId={data.gitProvider}
                        onSelect={(option) => onChange("gitProvider", option.value)}
                        columns={2}
                        accentColor="teal"
                        disabled={disabled}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <Input
                            label="Repository URL"
                            icon={<Globe />}
                            value={data.repoUrl}
                            onChange={(val) => onChange("repoUrl", val)}
                            disabled={disabled}
                            placeholder="https://github.com/szervezet/app-mes.git"
                            helperText="A klónozáshoz szükséges HTTPS vagy SSH formátumú URL."
                            accentColor="teal"
                            className="lg:col-span-2"
                        />

                        <Input
                            label="Telepítendő Ág (Branch)"
                            icon={<GitBranch />}
                            value={data.branch}
                            onChange={(val) => onChange("branch", val)}
                            disabled={disabled}
                            placeholder="main"
                            helperText="Alapértelmezett: main vagy master."
                            accentColor="teal"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t border-slate-800/60">
                        <Input
                            label="Access Token / Deploy Key (Opcionális)"
                            icon={<Lock />}
                            type="password"
                            value={data.gitToken ?? ""}
                            onChange={(val) => onChange("gitToken", val)}
                            disabled={disabled}
                            placeholder="ghp_... vagy glpat-... (csak privát repóhoz)"
                            helperText="Nyilvános repó esetén üresen hagyható. Privát tárolóhoz olvasási jogú Personal Access Token szükséges."
                            accentColor="orange"
                        />

                        <Input
                            label="Webhook Titkos Kulcs (Webhook Secret)"
                            icon={<KeyRound />}
                            value={data.webhookSecret}
                            onChange={(val) => onChange("webhookSecret", val)}
                            disabled={disabled}
                            placeholder="whsec_automatikus_titok"
                            helperText="A Git események (push, PR) hitelesítéséhez a Kubernetes Ingress felé."
                            accentColor="skyblue"
                        />
                    </div>

                    <div className="pt-2 border-t border-slate-800/60">
                        <PresetGroup
                            title="Telepítési Stratégia (Deployment Strategy)"
                            subtitle="Hogyan frissítse a Kubernetes az alkalmazást új verzió kiadásakor"
                            options={STRATEGY_OPTIONS}
                            selectedId={data.deploymentStrategy}
                            onSelect={(option) => onChange("deploymentStrategy", option.value)}
                            columns={3}
                            accentColor="teal"
                            disabled={disabled}
                        />
                    </div>
                </div>
            )}

            {!data.gitEnabled && (
                <div className="w-full">
                    <InfoCallout
                        title="A GitOps konfiguráció inaktív"
                        icon={<GitPullRequest className="w-5 h-5 text-cud-teal" />}
                    >
                        <p>
                            A platform kezdetben a meglévő, előre épített Docker konténerképekkel fog üzemelni közvetlen Git szinkronizáció nélkül.
                            A GitOps folyamatot és az automatikus telepítési stratégiát (RollingUpdate, Blue-Green, Canary) az inicializálás után a Vezérlőpultban bármikor aktiválhatod és finomhangolhatod.
                        </p>
                    </InfoCallout>
                </div>
            )}
        </div>
    )
}