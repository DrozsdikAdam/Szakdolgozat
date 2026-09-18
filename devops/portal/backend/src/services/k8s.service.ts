import { K8sWorkloadService } from "./k8s/k8s-workload.service.js";
import { K8sConfigService } from "./k8s/k8s-config.service.js";
import { K8sHealthService } from "./k8s/k8s-health.service.js";
import type { JobTriggerResponseDto } from "../dtos/backup.dto.js";
import type {
    ClusterOverviewDto,
    K8sEventDto,
    PodLogsResponseDto,
    RateLimitResponseDto,
    UpdateHpaDto,
    UpdateRateLimitDto,
    UpdateVpaDto,
    VpaOverviewDto,
} from "../dtos/k8s.dto.js";
import type {
    ConfigMapDto,
    SecretDto,
    SecretRevealDto,
    SaveConfigDto,
    RestartWorkloadDto
} from "../dtos/config.dto.js";
import type {
    WorkloadHealthDto,
    UpdateProbeDto,
    ProbeTestResultDto
} from "../dtos/healthcheck.dto.js";
import type { DatabaseEngine, DatabaseMode, InstanceSize } from "../types/setup.types.js";

export class K8sService {
    private workloadService: K8sWorkloadService;
    private configService: K8sConfigService;
    private healthService: K8sHealthService;

    constructor() {
        this.workloadService = new K8sWorkloadService();
        this.configService = new K8sConfigService();
        this.healthService = new K8sHealthService();
    }

    getClusterOverView = async (): Promise<ClusterOverviewDto> => {
        return this.workloadService.getClusterOverView();
    };

    getRateLimit = async (namespace = 'app-mes', ingressName = 'mes-ingress'): Promise<RateLimitResponseDto> => {
        return this.workloadService.getRateLimit(namespace, ingressName);
    };

    updateRateLimit = async (request: UpdateRateLimitDto, namespace = 'app-mes', ingressName = 'mes-ingress'): Promise<void> => {
        return this.workloadService.updateRateLimit(request, namespace, ingressName);
    };

    setMaintenanceMode = async (enabled: boolean, namespace = 'app-mes', ingressName = 'mes-ingress'): Promise<{ success: boolean; message: string }> => {
        return this.workloadService.setMaintenanceMode(enabled, namespace, ingressName);
    };

    triggerBackupJob = async (namespace = 'platform-infra', cronjob = 'db-backup'): Promise<JobTriggerResponseDto> => {
        return this.workloadService.triggerBackupJob(namespace, cronjob);
    };

    triggerRestore = async (targetBackup = 'latest', namespace = 'platform-infra', cronjob = 'db-restore'): Promise<JobTriggerResponseDto> => {
        return this.workloadService.triggerRestore(targetBackup, namespace, cronjob);
    };

    getHpa = async (namespace = 'app-mes', name = 'mes-backend-hpa'): Promise<UpdateHpaDto> => {
        return this.workloadService.getHpa(namespace, name);
    };

    updateHpa = async (request: UpdateHpaDto, namespace = 'app-mes', name = 'mes-backend-hpa'): Promise<void> => {
        return this.workloadService.updateHpa(request, namespace, name);
    };

    getVpa = async (namespace = 'app-mes', name = 'mes-backend-vpa'): Promise<VpaOverviewDto> => {
        return this.workloadService.getVpa(namespace, name);
    };

    updateVpa = async (request: UpdateVpaDto, namespace = 'app-mes', name = 'mes-backend-vpa'): Promise<void> => {
        return this.workloadService.updateVpa(request, namespace, name);
    };

    deployDatabaseEngine = async (engine: DatabaseEngine, mode: DatabaseMode): Promise<{ success: boolean; message: string }> => {
        return this.workloadService.deployDatabaseEngine(engine, mode);
    };

    applyInstanceSize = async (size: InstanceSize, namespace = 'app-mes', deploymentName = 'mes-backend'): Promise<{ success: boolean; message: string }> => {
        return this.workloadService.applyInstanceSize(size, namespace, deploymentName);
    };

    scaleDeployment = async (name: string, namespace: string, replicas: number) => {
        return this.workloadService.scaleDeployment(name, namespace, replicas);
    };

    setCronJobSuspended = async (name: string, namespace: string, suspended: boolean) => {
        return this.workloadService.setCronJobSuspended(name, namespace, suspended);
    };

    getPodLogs = async (
        namespace: string,
        podName: string,
        tailLines = 150,
        container?: string
    ): Promise<PodLogsResponseDto> => {
        return this.workloadService.getPodLogs(namespace, podName, tailLines, container);
    };

    getClusterEvents = async (
        namespace?: string,
        podName?: string
    ): Promise<K8sEventDto[]> => {
        return this.workloadService.getClusterEvents(namespace, podName);
    };

    getConfigMaps = async (namespace?: string): Promise<ConfigMapDto[]> => {
        return this.configService.getConfigMaps(namespace);
    };

    getSecrets = async (namespace?: string): Promise<SecretDto[]> => {
        return this.configService.getSecrets(namespace);
    };

    revealSecret = async (namespace: string, name: string): Promise<SecretRevealDto> => {
        return this.configService.revealSecret(namespace, name);
    };

    saveConfigMap = async (dto: SaveConfigDto): Promise<ConfigMapDto> => {
        return this.configService.saveConfigMap(dto);
    };

    deleteConfigMap = async (namespace: string, name: string): Promise<boolean> => {
        return this.configService.deleteConfigMap(namespace, name);
    };

    saveSecret = async (dto: SaveConfigDto): Promise<SecretDto> => {
        return this.configService.saveSecret(dto);
    };

    deleteSecret = async (namespace: string, name: string): Promise<boolean> => {
        return this.configService.deleteSecret(namespace, name);
    };

    restartWorkload = async (namespace: string, workloadNames: string[]): Promise<RestartWorkloadDto> => {
        return this.configService.restartWorkload(namespace, workloadNames);
    };

    getWorkloadHealth = async (namespace?: string): Promise<WorkloadHealthDto[]> => {
        return this.healthService.getWorkloadHealth(namespace);
    };

    updateWorkloadProbe = async (dto: UpdateProbeDto): Promise<WorkloadHealthDto> => {
        return this.healthService.updateWorkloadProbe(dto);
    };

    testProbeEndpoint = async (
        namespace: string,
        deploymentName: string,
        path: string = '/actuator/health',
        port: number | string = 8080
    ): Promise<ProbeTestResultDto> => {
        return this.healthService.testProbeEndpoint(namespace, deploymentName, path, port);
    };
}