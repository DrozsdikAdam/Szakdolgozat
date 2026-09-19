import { useState, useEffect, useMemo, useCallback } from "react";
import { HealthcheckApi } from "../client/api/healthcheck";
import type { WorkloadHealthDto, UpdateProbeDto, ProbeTestResultDto } from "../types/healthcheck";

export interface ActiveTestResult {
    deployment: string;
    result: ProbeTestResultDto;
}

export interface ToastMessage {
    text: string;
    type: "success" | "error";
}

export const useHealthchecks = () => {
    const [workloads, setWorkloads] = useState<WorkloadHealthDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [namespace, setNamespace] = useState<string>("all");
    const [search, setSearch] = useState<string>("");

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [selectedWorkload, setSelectedWorkload] = useState<WorkloadHealthDto | null>(null);
    const [isSaving, setIsSaving] = useState<boolean>(false);

    const [testingDeployment, setTestingDeployment] = useState<string | null>(null);
    const [activeTestResult, setActiveTestResult] = useState<ActiveTestResult | null>(null);

    const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);

    const healthcheckApi = useMemo(() => new HealthcheckApi(), []);

    const showToast = useCallback((text: string, type: "success" | "error" = "success") => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage(null), 4500);
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await healthcheckApi.getHealthchecks(namespace);
            setWorkloads(data || []);
        } catch (err) {
            console.error("Nem sikerült lekérni a szondákat:", err);
            showToast("Nem sikerült elérni a szondák állapotát a klaszterből.", "error");
        } finally {
            setLoading(false);
        }
    }, [healthcheckApi, namespace, showToast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleTestProbe = async (workload: WorkloadHealthDto) => {
        setTestingDeployment(workload.name);
        try {
            const probeToTest = workload.livenessProbe || workload.readinessProbe || workload.startupProbe;
            const path = probeToTest?.httpPath || "/actuator/health";
            const port = probeToTest?.port || 8080;

            const result = await healthcheckApi.testProbe(workload.namespace, workload.name, path, port);
            setActiveTestResult({ deployment: workload.name, result });
            if (result.success) {
                showToast(`Ping teszt sikeres (${workload.name}): HTTP ${result.statusCode} (${result.responseTimeMs} ms)`, "success");
            } else {
                showToast(`Ping teszt figyelmeztetés (${workload.name}): ${result.message}`, "error");
            }
        } catch (err: any) {
            showToast(`A szonda tesztelése sikertelen volt: ${err.message || err}`, "error");
        } finally {
            setTestingDeployment(null);
        }
    };

    const handleSaveProbe = async (dto: UpdateProbeDto) => {
        setIsSaving(true);
        try {
            await healthcheckApi.updateProbe(dto);
            showToast(`A(z) ${dto.probeKind} szonda sikeresen frissítve a '${dto.deploymentName}' workloadon!`, "success");
            setIsModalOpen(false);
            await loadData();
        } catch (err: any) {
            showToast(`Hiba a szonda mentésekor: ${err.message || err}`, "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenModal = (workload: WorkloadHealthDto) => {
        setSelectedWorkload(workload);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const filteredWorkloads = useMemo(() => {
        const query = search.trim().toLowerCase();
        return workloads.filter((w) => {
            const matchesSearch =
                !query ||
                w.name.toLowerCase().includes(query) ||
                w.namespace.toLowerCase().includes(query) ||
                Boolean(w.containerName && w.containerName.toLowerCase().includes(query));

            const matchesNamespace = namespace === "all" || w.namespace === namespace;

            return matchesSearch && matchesNamespace;
        });
    }, [workloads, search, namespace]);

    const stats = useMemo(() => ({
        total: workloads.length,
        healthy: workloads.filter((w) => w.status === "healthy").length,
        warning: workloads.filter((w) => w.status === "warning" || w.status === "critical").length,
        unconfigured: workloads.filter((w) => w.status === "unconfigured").length,
    }), [workloads]);

    return {
        workloads,
        filteredWorkloads,
        loading,
        namespace,
        setNamespace,
        search,
        setSearch,
        stats,
        testingDeployment,
        activeTestResult,
        setActiveTestResult,
        isModalOpen,
        selectedWorkload,
        isSaving,
        toastMessage,
        loadData,
        handleTestProbe,
        handleSaveProbe,
        handleOpenModal,
        handleCloseModal
    };
};
