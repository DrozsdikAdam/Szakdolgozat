import * as k8s from "@kubernetes/client-node";

export function createMssqlDeploymentManifest(namespace: string): k8s.V1Deployment {
    return {
        metadata: { name: 'mssql', namespace, labels: { app: 'mssql' } },
        spec: {
            replicas: 1,
            selector: { matchLabels: { app: 'mssql' } },
            template: {
                metadata: { labels: { app: 'mssql' } },
                spec: {
                    containers: [{
                        name: 'mssql',
                        image: 'mcr.microsoft.com/mssql/server:2022-latest',
                        ports: [{ containerPort: 1433 }],
                        env: [
                            { name: 'ACCEPT_EULA', value: 'Y' },
                            { name: 'MSSQL_PID', value: 'Developer' },
                            { name: 'MSSQL_SA_PASSWORD', value: 'MesStrongPass123!' },
                            { name: 'DB_NAME', value: 'mesdb' }
                        ],
                        resources: {
                            requests: { memory: '1536Mi', cpu: '500m' },
                            limits: { memory: '2560Mi', cpu: '2000m' }
                        }
                    }]
                }
            }
        }
    };
}

export function createMssqlServiceManifest(namespace: string): k8s.V1Service {
    return {
        metadata: { name: 'mssql', namespace },
        spec: {
            type: 'ClusterIP',
            selector: { app: 'mssql' },
            ports: [{ port: 1433, targetPort: 1433, name: 'mssql' }]
        }
    };
}

export function createOracleDeploymentManifest(namespace: string): k8s.V1Deployment {
    return {
        metadata: { name: 'oracle', namespace, labels: { app: 'oracle' } },
        spec: {
            replicas: 1,
            selector: { matchLabels: { app: 'oracle' } },
            template: {
                metadata: { labels: { app: 'oracle' } },
                spec: {
                    containers: [{
                        name: 'oracle',
                        image: 'gvenzl/oracle-free:latest',
                        ports: [{ containerPort: 1521 }],
                        env: [
                            { name: 'APP_USER', value: 'mesuser' },
                            { name: 'APP_USER_PASSWORD', value: 'mespassword' },
                            { name: 'ORACLE_PASSWORD', value: 'MesStrongPass123!' },
                            { name: 'ORACLE_DATABASE', value: 'mesdb' }
                        ],
                        resources: {
                            requests: { memory: '1024Mi', cpu: '500m' },
                            limits: { memory: '3Gi', cpu: '2000m' }
                        }
                    }]
                }
            }
        }
    };
}

export function createOracleServiceManifest(namespace: string): k8s.V1Service {
    return {
        metadata: { name: 'oracle', namespace },
        spec: {
            type: 'ClusterIP',
            selector: { app: 'oracle' },
            ports: [{ port: 1521, targetPort: 1521, name: 'oracle' }]
        }
    };
}
