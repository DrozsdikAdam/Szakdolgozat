import { useState, useEffect, useMemo } from "react";
import { K8sApi } from "../client/api/k8s";

export interface NamespaceOption {
    value: string;
    label: string;
}

const FALLBACK_NAMESPACES = ["platform-infra", "app-mes"];

export const useNamespaces = (includeAll = true) => {
    const [namespaces, setNamespaces] = useState<string[]>(FALLBACK_NAMESPACES);
    const [loading, setLoading] = useState<boolean>(true);

    const api = useMemo(() => new K8sApi(), []);

    useEffect(() => {
        let isMounted = true;
        api.getNamespaces()
            .then((data) => {
                if (isMounted && Array.isArray(data) && data.length > 0) {
                    setNamespaces(data);
                }
            })
            .catch((err) => {
                console.warn("[useNamespaces] Hiba a névterek lekérésekor:", err);
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [api]);

    const namespaceOptions: NamespaceOption[] = useMemo(() => {
        const options = namespaces.map((ns) => ({ value: ns, label: ns }));
        if (includeAll) {
            return [{ value: "all", label: "Minden névtér" }, ...options];
        }
        return options;
    }, [namespaces, includeAll]);

    const defaultAppNamespace = useMemo(
        () => namespaces.find((ns) => !ns.includes("platform")) || namespaces[namespaces.length - 1] || "app-mes",
        [namespaces]
    );

    const defaultPlatformNamespace = useMemo(
        () => namespaces.find((ns) => ns.includes("platform")) || namespaces[0] || "platform-infra",
        [namespaces]
    );

    return {
        namespaces,
        namespaceOptions,
        defaultAppNamespace,
        defaultPlatformNamespace,
        loading
    };
};
