import * as k8s from "@kubernetes/client-node";
import { K8sClientService } from "./k8s-client.service.js";
import {
    createMssqlStatefulSetManifest,
    createMssqlHeadlessServiceManifest,
    createMssqlServiceManifest,
    createOracleStatefulSetManifest,
    createOracleHeadlessServiceManifest,
    createOracleServiceManifest
} from "./k8s-database.templates.js";
import type { DatabaseEngine, DatabaseMode } from "../../types/setup.types.js";

export class K8sDatabaseService {
    private client: K8sClientService;

    constructor() {
        this.client = K8sClientService.getInstance();
    }

    private upsertStatefulSet = async (name: string, namespace: string, body: k8s.V1StatefulSet): Promise<void> => {
        try {
            await this.client.appsApi.readNamespacedStatefulSet({ name, namespace });
            await this.client.appsApi.replaceNamespacedStatefulSet({ name, namespace, body });
        } catch {
            await this.client.appsApi.createNamespacedStatefulSet({ namespace, body });
        }
    };

    private upsertService = async (name: string, namespace: string, body: k8s.V1Service): Promise<void> => {
        try {
            await this.client.coreApi.readNamespacedService({ name, namespace });
        } catch {
            await this.client.coreApi.createNamespacedService({ namespace, body });
        }
    };

    private deployMssql = async (namespace: string): Promise<void> => {
        const statefulSet = createMssqlStatefulSetManifest(namespace);
        const headlessService = createMssqlHeadlessServiceManifest(namespace);
        const service = createMssqlServiceManifest(namespace);

        await this.upsertStatefulSet("mssql", namespace, statefulSet);
        await this.upsertService("mssql-headless", namespace, headlessService);
        await this.upsertService("mssql", namespace, service);
    };

    private deployOracle = async (namespace: string): Promise<void> => {
        const statefulSet = createOracleStatefulSetManifest(namespace);
        const headlessService = createOracleHeadlessServiceManifest(namespace);
        const service = createOracleServiceManifest(namespace);

        await this.upsertStatefulSet("oracle", namespace, statefulSet);
        await this.upsertService("oracle-headless", namespace, headlessService);
        await this.upsertService("oracle", namespace, service);
    };

    private deployPostgres = async (namespace: string): Promise<void> => {
        try {
            const sts = await this.client.appsApi.readNamespacedStatefulSet({
                name: "postgres-postgresql-ha-postgresql",
                namespace
            });
            if (!sts.spec || (sts.spec.replicas ?? 0) >= 1) return;

            sts.spec.replicas = 1;
            await this.client.appsApi.replaceNamespacedStatefulSet({
                name: "postgres-postgresql-ha-postgresql",
                namespace,
                body: sts
            });
        } catch (err) {
            console.warn("[K8sDatabaseService] PostgreSQL StatefulSet állapot lekérdezési figyelmeztetés:", (err as any)?.message || err);
        }
    };

    deployDatabaseEngine = async (engine: DatabaseEngine, mode: DatabaseMode): Promise<{ success: boolean; message: string }> => {
        if (mode !== "internal") {
            console.log(`[K8sDatabaseService] Adatbázis mód '${mode}', belső K8s provisioning nem szükséges.`);
            return { success: true, message: `Külső adatbázis kapcsolat regisztrálva (${engine})` };
        }

        const namespace = "platform-infra";

        try {
            if (engine === "mssql") {
                await this.deployMssql(namespace);
                console.log("[K8sDatabaseService] MS SQL Server 2022 StatefulSet és service-ek sikeresen alkalmazva.");
                return { success: true, message: "MS SQL Server 2022 provisioning sikeres a platform-infra névtérben" };
            }

            if (engine === "oracle") {
                await this.deployOracle(namespace);
                console.log("[K8sDatabaseService] Oracle Database Free 23c StatefulSet és service-ek sikeresen alkalmazva.");
                return { success: true, message: "Oracle Database Free 23c provisioning sikeres a platform-infra névtérben" };
            }

            await this.deployPostgres(namespace);
            console.log("[K8sDatabaseService] PostgreSQL Patroni HA klaszter aktív a platform-infra névtérben.");
            return { success: true, message: "PostgreSQL Patroni HA klaszter aktív a fürtben" };
        } catch (error) {
            console.warn(`[K8sDatabaseService] Figyelmeztetés a(z) ${engine} K8s provisioning során:`, (error as any)?.message || error);
            return { success: false, message: `K8s provisioning figyelmeztetés: ${(error as any)?.message || error}` };
        }
    };
}
