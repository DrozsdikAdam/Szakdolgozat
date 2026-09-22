import { useState } from "react";
import type { SetupFormData } from "../types/component/setup/setupDataProps";
import type { FeatureFlagName, SetupWizardPayload } from "../types/platform";
import { PlatformApi } from "../client/api/platform";
import { WizardNav } from "../components/setup/WizardNav";
import { GitStep } from "../components/setup/step/Git";
import { DatabaseStep } from "../components/setup/step/Database";
import { StorageStep } from "../components/setup/step/Storage";
import { TrafficStep } from "../components/setup/step/Traffic";
import { AutoScalingStep } from "../components/setup/step/Autoscaling";
import { ReviewStep } from "../components/setup/step/Review";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { CheckCircle2, ArrowRight, AlertTriangle } from "lucide-react";

interface SetupTabProps {
    onComplete?: () => void;
}

const INITIAL_FORM_DATA: SetupFormData = {
    gitEnabled: true,
    gitProvider: "GITHUB",
    repoUrl: "https://github.com/mes-corp/mes-app",
    branch: "main",
    deploymentStrategy: "RollingUpdate",
    webhookSecret: "",

    dbEnabled: true,
    dbEngine: "postgres",
    dbMode: "internal",
    dbConnectionString: "",

    storageEnabled: true,
    s3Provider: "internal",
    s3Bucket: "mes-backups",
    s3BucketSize: "5Gi",
    s3Endpoint: "",
    s3AccessKey: "",
    s3SecretKey: "",

    trafficEnabled: true,
    rateLimitRps: 100,
    burstMultiplier: 5,

    autoscalingEnabled: true,
    autoscalingStrategy: "hpa",
    minReplicas: 2,
    maxReplicas: 6,
    targetCpu: 70,
    instanceSize: "small",

    inactivationStrategy: "scale_to_zero",
    enabledFeatures: [],
};

export const SetupTab = ({ onComplete }: SetupTabProps) => {
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [formData, setFormData] = useState<SetupFormData>(INITIAL_FORM_DATA);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSuccess, setIsSuccess] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleFormChange = <K extends keyof SetupFormData>(field: K, value: SetupFormData[K]) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleNext = () => {
        if (currentStep < 6) {
            setCurrentStep((prev) => prev + 1);
        } else {
            handleCompleteSetup();
        }
    };

    const handlePrev = () => {
        if (currentStep > 1) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    const handleGoToStep = (step: number) => {
        if (step >= 1 && step <= 6) {
            setCurrentStep(step);
        }
    };

    const handleCompleteSetup = async () => {
        setIsLoading(true);
        setErrorMessage(null);

        try {
            const features: FeatureFlagName[] = [];
            if (formData.trafficEnabled) features.push("rate_limiting");
            if (formData.storageEnabled) features.push("cronjob_backup");
            if (formData.autoscalingEnabled) {
                if (formData.autoscalingStrategy === "hpa") features.push("hpa_scaling");
                if (formData.autoscalingStrategy === "vpa") features.push("vpa_scaling");
            }

            const payload: SetupWizardPayload = {
                gitProvider: formData.gitProvider,
                repoUrl: formData.repoUrl,
                webhookSecret: formData.webhookSecret || undefined,
                dbEngine: formData.dbEngine,
                dbMode: formData.dbMode,
                s3Provider: formData.s3Provider,
                s3Bucket: formData.s3Bucket,
                s3BucketSize: formData.s3BucketSize,
                instanceSize: formData.instanceSize,
                inactivationStrategy: formData.inactivationStrategy || "scale_to_zero",
                enabledFeatures: features,
            };

            await new PlatformApi().setup(payload);
            setIsSuccess(true);
        } catch (error: any) {
            console.error("[SetupTab] Hiba a platform inicializálása során:", error);
            setErrorMessage(error?.message || "Nem sikerült menteni a konfigurációt a platform backend felé.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <Card title="Platform Inicializálva" hoverEffect={false}>
                <div className="py-12 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
                    <div className="w-16 h-16 rounded-full bg-cud-teal/10 border border-cud-teal text-cud-teal flex items-center justify-center mb-6 shadow-lg shadow-cud-teal/20">
                        <CheckCircle2 className="w-9 h-9" />
                    </div>

                    <h2 className="text-2xl font-bold text-slate-100 mb-2">
                        Platform Sikeresen Inicializálva!
                    </h2>
                    <p className="text-sm text-slate-400 mb-6">
                        A Kubernetes klaszter megkapta a konfigurációkat. Az adatbázis motor, az erőforráskorlátok,
                        a forgalomszabályozás és a perzisztens kötetek élesítésre kerültek.
                    </p>

                    <div className="w-full p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-left text-xs text-slate-300 mb-6 flex flex-col gap-2 font-mono">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Adatbázis Motor:</span>
                            <span className="text-slate-200 font-bold uppercase">{formData.dbEngine} ({formData.dbMode})</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Erőforrás Méret:</span>
                            <span className="text-slate-200 font-bold uppercase">
                                {formData.autoscalingEnabled ? `HPA (${formData.minReplicas}-${formData.maxReplicas} pod)` : `${formData.instanceSize} (fix)`}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Forgalomkorlát:</span>
                            <span className="text-slate-200 font-bold">{formData.rateLimitRps} RPS ({formData.burstMultiplier}x burst)</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">S3 Mentési Bucket:</span>
                            <span className="text-slate-200 font-bold">{formData.s3Bucket} ({formData.s3BucketSize})</span>
                        </div>
                    </div>

                    {onComplete && (
                        <Button
                            variant="primary"
                            size="lg"
                            icon={<ArrowRight className="w-4 h-4" />}
                            onClick={onComplete}
                            className="bg-cud-teal hover:bg-cud-teal/90 text-slate-950 font-bold shadow-lg shadow-cud-teal/20"
                        >
                            Tovább a Szolgáltatáskatalógushoz
                        </Button>
                    )}
                </div>
            </Card>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-slate-100">
                    PaaS Platform Beállító Varázsló
                </h1>
                <p className="text-sm text-slate-400">
                    Konfiguráld a GitOps forráskódot, az adatbázis réteget, a tárhelyet, a hálózati forgalomkorlátokat és az erőforrás-gazdálkodást.
                </p>
            </div>

            {errorMessage && (
                <div className="p-4 rounded-xl bg-cud-vermillon/10 border border-cud-vermillon/40 text-cud-vermillon flex items-center gap-3 text-xs">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}

            <WizardNav
                currentStep={currentStep}
                totalSteps={6}
                onNext={handleNext}
                onPrev={handlePrev}
                onGoToStep={handleGoToStep}
                isLoading={isLoading}
                isLastStep={currentStep === 6}
                isFirstStep={currentStep === 1}
            >
                <div className="mt-2">
                    {currentStep === 1 && (
                        <GitStep
                            data={formData}
                            onChange={handleFormChange}
                            disabled={isLoading}
                        />
                    )}
                    {currentStep === 2 && (
                        <DatabaseStep
                            data={formData}
                            onChange={handleFormChange}
                            disabled={isLoading}
                        />
                    )}
                    {currentStep === 3 && (
                        <StorageStep
                            data={formData}
                            onChange={handleFormChange}
                            disabled={isLoading}
                        />
                    )}
                    {currentStep === 4 && (
                        <TrafficStep
                            data={formData}
                            onChange={handleFormChange}
                            disabled={isLoading}
                        />
                    )}
                    {currentStep === 5 && (
                        <AutoScalingStep
                            data={formData}
                            onChange={handleFormChange}
                            disabled={isLoading}
                        />
                    )}
                    {currentStep === 6 && (
                        <ReviewStep
                            data={formData}
                            onGoToStep={handleGoToStep}
                        />
                    )}
                </div>
            </WizardNav>
        </div>
    );
};
