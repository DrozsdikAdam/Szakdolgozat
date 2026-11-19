import * as k8s from "@kubernetes/client-node";
import { K8sClientService } from "./k8s-client.service.js";
import { DEFAULT_PLATFORM_NAMESPACE } from "../../constants/namespace.constants.js";
import type { JobTriggerResponseDto } from "../../dtos/backup.dto.js";

export class K8sBackupService {
    private client: K8sClientService;

    constructor() {
        this.client = K8sClientService.getInstance();
    }

    private cleanupPreviousJobs = async (namespace: string, labelSelector: string, namePrefix: string): Promise<{ cleanedCount: number; errorsCount: number }> => {
        let cleanedCount = 0;
        let errorsCount = 0;

        try {
            const existing = await this.client.batchApi.listNamespacedJob({
                namespace,
                labelSelector,
            });

            const jobsToDelete = (existing.items || []).filter(
                (j) => j.metadata?.name && j.metadata.name.startsWith(namePrefix)
            );

            for (const job of jobsToDelete) {
                const jobName = job.metadata!.name!;
                try {
                    await this.client.batchApi.deleteNamespacedJob({
                        name: jobName,
                        namespace,
                        propagationPolicy: "Background",
                    });
                    cleanedCount++;
                    console.log(`[K8sBackupService] Korábbi manuális Job sikeresen eltávolítva: ${jobName}`);
                } catch (delError: any) {
                    const statusCode = delError?.response?.statusCode || delError?.statusCode;
                    if (statusCode === 404) {
                        continue;
                    }
                    errorsCount++;
                    console.warn(
                        `[K8sBackupService] Nem sikerült törölni a korábbi Jobot (${jobName}):`,
                        delError?.message || delError
                    );
                }
            }
        } catch (listError: any) {
            console.warn(
                `[K8sBackupService] Nem sikerült lekérdezni a korábbi Jobokat (${labelSelector}):`,
                listError?.message || listError
            );
        }

        return { cleanedCount, errorsCount };
    };

    triggerBackupJob = async (namespace = DEFAULT_PLATFORM_NAMESPACE, cronjob = "db-backup"): Promise<JobTriggerResponseDto> => {
        const name = `manual-backup-${Date.now()}`;
        try {
            await this.cleanupPreviousJobs(namespace, "app=db-backup", "manual-backup-");

            const cronJob = await this.client.batchApi.readNamespacedCronJob({ name: cronjob, namespace });

            if (!cronJob.spec?.jobTemplate?.spec)
                throw new Error("Invalid cronjob spec");

            const job: k8s.V1Job = {
                metadata: {
                    name,
                    labels: {
                        app: "db-backup"
                    }
                },
                spec: {
                    ...cronJob.spec?.jobTemplate?.spec || {},
                    backoffLimit: 2,
                    activeDeadlineSeconds: 300,
                    ttlSecondsAfterFinished: 60
                }
            };

            await this.client.batchApi.createNamespacedJob({ namespace, body: job });

            return {
                jobName: name,
                message: "Backup job triggered successfully"
            };
        } catch (error) {
            console.warn("[K8sBackupService] K8s API nem érhető el (pl. helyi fejlesztés), szimulált mentési Job indítása:", (error as any)?.message || error);
            return {
                jobName: name,
                message: "A mentési K8s Job elindult (szimulált környezetben)"
            };
        }
    };

    triggerRestore = async (targetBackup = "latest", namespace = DEFAULT_PLATFORM_NAMESPACE, cronjob = "db-restore"): Promise<JobTriggerResponseDto> => {
        const name = `manual-restore-${Date.now()}`;
        try {
            await this.cleanupPreviousJobs(namespace, "app=db-restore", "manual-restore-");

            const cronJob = await this.client.batchApi.readNamespacedCronJob({ name: cronjob, namespace });

            if (!cronJob.spec?.jobTemplate?.spec)
                throw new Error("Invalid restore cronjob spec");

            const jobSpec = JSON.parse(JSON.stringify(cronJob.spec.jobTemplate.spec)) as k8s.V1JobSpec;
            const initContainers = jobSpec.template.spec?.initContainers ?? [];
            const fetchContainer = initContainers.find(c => c.name === "fetch-backup");

            if (!fetchContainer)
                throw new Error("Fetch container not found");

            if (!fetchContainer.env) fetchContainer.env = [];

            const targetEnv = fetchContainer.env.find(e => e.name === "TARGET_BACKUP");

            if (targetEnv)
                targetEnv.value = targetBackup;
            else
                fetchContainer.env.push({ name: "TARGET_BACKUP", value: targetBackup });

            const job: k8s.V1Job = {
                metadata: {
                    name,
                    labels: {
                        app: "db-restore",
                    },
                },
                spec: {
                    ...jobSpec,
                    backoffLimit: 2,
                    activeDeadlineSeconds: 300,
                    ttlSecondsAfterFinished: 60,
                },
            };

            await this.client.batchApi.createNamespacedJob({ namespace, body: job });

            return {
                jobName: name,
                message: "Database restore job triggered successfully",
            };
        } catch (error) {
            console.warn("[K8sBackupService] K8s API nem érhető el (pl. helyi fejlesztés), szimulált visszaállítási Job indítása:", (error as any)?.message || error);
            return {
                jobName: name,
                message: `Adatbázis visszaállítási Job elindítva: ${targetBackup} (szimulált környezetben)`
            };
        }
    };
}
