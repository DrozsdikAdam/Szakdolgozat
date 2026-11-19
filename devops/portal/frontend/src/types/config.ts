export interface ConfigMapDto {
    name: string;
    namespace: string;
    data: Record<string, string>;
    keyCount: number;
    createdAt: string;
    boundWorkloads?: string[];
}

export interface SecretDto {
    name: string;
    namespace: string;
    secretType: string;
    data: Record<string, string>;
    keys: string[];
    keyCount: number;
    isMasked: boolean;
    createdAt: string;
    boundWorkloads?: string[];
}

export interface SecretRevealDto {
    name: string;
    namespace: string;
    data: Record<string, string>;
}

export interface SaveConfigDto {
    name: string;
    namespace: string;
    data: Record<string, string>;
    secretType?: string;
}

export interface RestartWorkloadDto {
    namespace: string;
    workloadNames: string[];
    message?: string;
    restartedAt?: string;
}

export type ConfigViewType = 'configmaps' | 'secrets';
