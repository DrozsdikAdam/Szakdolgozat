import { K8sConfigService } from "./k8s/k8s-config.service.js";
import { K8sHealthService } from "./k8s/k8s-health.service.js";
import { K8sDeploymentService } from "./k8s/k8s-deployment.service.js";
import { K8sTelemetryService } from "./k8s/k8s-telemetry.service.js";
import { K8sDatabaseService } from "./k8s/k8s-database.service.js";
import { K8sAutoscalingService } from "./k8s/k8s-autoscaling.service.js";
import { K8sIngressService } from "./k8s/k8s-ingress.service.js";
import { K8sBackupService } from "./k8s/k8s-backup.service.js";
import { K8sPodService } from "./k8s/k8s-pod.service.js";
import { K8sInstanceService } from "./k8s/k8s-instance.service.js";
import {
    DEFAULT_APP_NAMESPACE,
    DEFAULT_PLATFORM_NAMESPACE,
    DEFAULT_APP_NAME,
    DEFAULT_HPA_NAME,
    DEFAULT_VPA_NAME,
    getManagedNamespaces
} from "../constants/namespace.constants.js";
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
import type {
    DeploymentsOverviewDto,
    WorkloadDeploymentDto,
    UpdateDeploymentStrategyDto,
    RollbackDeploymentDto
} from "../dtos/deployment.dto.js";
import type {
    TelemetryOverViewDto,
    TelemetryTimeRange,
    WorkloadMetricDto,
    GrafanaDashboardDto
} from "../dtos/telemetry.dto.js";
import type { DatabaseEngine, DatabaseMode, InstanceSize } from "../types/setup.types.js";

export class K8sService {
    private configService: K8sConfigService;
    private healthService: K8sHealthService;
    private deploymentService: K8sDeploymentService;
    private telemetryService: K8sTelemetryService;
    private databaseService: K8sDatabaseService;
    private autoscalingService: K8sAutoscalingService;
    private ingressService: K8sIngressService;
    private backupService: K8sBackupService;
    private podService: K8sPodService;
    private instanceService: K8sInstanceService;

    constructor() {
        this.configService = new K8sConfigService();
        this.healthService = new K8sHealthService();
        this.deploymentService = new K8sDeploymentService();
        this.telemetryService = new K8sTelemetryService();
        this.databaseService = new K8sDatabaseService();
        this.autoscalingService = new K8sAutoscalingService();
        this.ingressService = new K8sIngressService();
        this.backupService = new K8sBackupService();
        this.podService = new K8sPodService();
        this.instanceService = new K8sInstanceService();
    }

    getClusterOverView = async (): Promise<ClusterOverviewDto> => {
        return this.podService.getClusterOverView();
    };

    getRateLimit = async (namespace = DEFAULT_APP_NAMESPACE, ingressName = 'mes-ingress'): Promise<RateLimitResponseDto> => {
        return this.ingressService.getRateLimit(namespace, ingressName);
    };

    updateRateLimit = async (request: UpdateRateLimitDto, namespace = DEFAULT_APP_NAMESPACE, ingressName = 'mes-ingress'): Promise<void> => {
        return this.ingressService.updateRateLimit(request, namespace, ingressName);
    };

    setMaintenanceMode = async (enabled: boolean, namespace = DEFAULT_APP_NAMESPACE, ingressName = 'mes-ingress'): Promise<{ success: boolean; message: string }> => {
        return this.ingressService.setMaintenanceMode(enabled, namespace, ingressName);
    };

    triggerBackupJob = async (namespace = DEFAULT_PLATFORM_NAMESPACE, cronjob = 'db-backup'): Promise<JobTriggerResponseDto> => {
        return this.backupService.triggerBackupJob(namespace, cronjob);
    };

    triggerRestore = async (targetBackup = 'latest', namespace = DEFAULT_PLATFORM_NAMESPACE, cronjob = 'db-restore'): Promise<JobTriggerResponseDto> => {
        return this.backupService.triggerRestore(targetBackup, namespace, cronjob);
    };

    getHpa = async (namespace = DEFAULT_APP_NAMESPACE, name = DEFAULT_HPA_NAME): Promise<UpdateHpaDto> => {
        return this.autoscalingService.getHpa(namespace, name);
    };

    updateHpa = async (request: UpdateHpaDto, namespace = DEFAULT_APP_NAMESPACE, name = DEFAULT_HPA_NAME): Promise<void> => {
        return this.autoscalingService.updateHpa(request, namespace, name);
    };

    getVpa = async (namespace = DEFAULT_APP_NAMESPACE, name = DEFAULT_VPA_NAME): Promise<VpaOverviewDto> => {
        return this.autoscalingService.getVpa(namespace, name);
    };

    updateVpa = async (request: UpdateVpaDto, namespace = DEFAULT_APP_NAMESPACE, name = DEFAULT_VPA_NAME): Promise<void> => {
        return this.autoscalingService.updateVpa(request, namespace, name);
    };

    deployDatabaseEngine = async (engine: DatabaseEngine, mode: DatabaseMode): Promise<{ success: boolean; message: string }> => {
        return this.databaseService.deployDatabaseEngine(engine, mode);
    };

    applyInstanceSize = async (size: InstanceSize, namespace = DEFAULT_APP_NAMESPACE, deploymentName = DEFAULT_APP_NAME): Promise<{ success: boolean; message: string }> => {
        return this.instanceService.applyInstanceSize(size, namespace, deploymentName);
    };

    getNamespaces = async (): Promise<string[]> => {
        return getManagedNamespaces();
    };

    scaleDeployment = async (name: string, namespace: string, replicas: number) => {
        return this.instanceService.scaleDeployment(name, namespace, replicas);
    };

    scaleStatefulSet = async (name: string, namespace: string, replicas: number) => {
        return this.instanceService.scaleStatefulSet(name, namespace, replicas);
    };

    setCronJobSuspended = async (name: string, namespace: string, suspended: boolean) => {
        return this.instanceService.setCronJobSuspended(name, namespace, suspended);
    };

    getPodLogs = async (
        namespace: string,
        podName: string,
        tailLines = 150,
        container?: string
    ): Promise<PodLogsResponseDto> => {
        return this.podService.getPodLogs(namespace, podName, tailLines, container);
    };

    getClusterEvents = async (
        namespace?: string,
        podName?: string
    ): Promise<K8sEventDto[]> => {
        return this.podService.getClusterEvents(namespace, podName);
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

    getDeploymentsOverview = async (namespace?: string): Promise<DeploymentsOverviewDto> => {
        return this.deploymentService.getDeploymentsOverview(namespace);
    };

    syncGitOps = async (): Promise<DeploymentsOverviewDto> => {
        return this.deploymentService.syncGitOps();
    };

    updateDeploymentStrategy = async (dto: UpdateDeploymentStrategyDto): Promise<WorkloadDeploymentDto> => {
        return this.deploymentService.updateDeploymentStrategy(dto);
    };

    rollbackDeployment = async (dto: RollbackDeploymentDto): Promise<WorkloadDeploymentDto> => {
        return this.deploymentService.rollbackDeployment(dto);
    };

    getTelemetryOverview = async (timeRange?: TelemetryTimeRange): Promise<TelemetryOverViewDto> => {
        return this.telemetryService.getOverview(timeRange);
    };

    getTelemetryWorkloads = async (namespace?: string): Promise<WorkloadMetricDto[]> => {
        return this.telemetryService.getWorkloadMetrics(namespace);
    };

    getTelemetryDashboards = (): GrafanaDashboardDto[] => {
        return this.telemetryService.getDashboards();
    };
}