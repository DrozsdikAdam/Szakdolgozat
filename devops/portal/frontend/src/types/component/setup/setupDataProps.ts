import type { DatabaseMode, GitProvider, S3Provider } from "../../platform";

export type DeploymentStrategy = 'RollingUpdate' | 'BlueGreen' | 'Canary';
export type DatabaseEngine = 'postgres' | 'mssql' | 'oracle';
export type InstanceSize = 'nano' | 'small' | 'medium' | 'large';

export interface SetupFormData {
    gitEnabled: boolean;
    gitProvider: GitProvider;
    repoUrl: string;
    gitToken?: string
    branch: string;
    deploymentStrategy: DeploymentStrategy;
    webhookSecret: string;

    dbEnabled: boolean;
    dbEngine: DatabaseEngine;
    dbMode: DatabaseMode;
    dbConnectionString?: string;

    storageEnabled: boolean;
    s3Provider: S3Provider;
    s3Bucket: string;
    s3BucketSize: string;
    s3Endpoint?: string;
    s3AccessKey?: string;
    s3SecretKey?: string;

    trafficEnabled: boolean;
    rateLimitRps: number;
    burstMultiplier: number;

    autoscalingEnabled: boolean;
    autoscalingStrategy: 'hpa' | 'vpa';
    minReplicas: number;
    maxReplicas: number;
    targetCpu: number;
    instanceSize?: InstanceSize;

    enabledFeatures: string[];
}
export interface SetupStepComponentProps {
    data: SetupFormData;
    onChange: <K extends keyof SetupFormData>(field: K, value: SetupFormData[K]) => void;
    disabled?: boolean;
}
