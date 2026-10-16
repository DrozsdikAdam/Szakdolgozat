import * as k8s from "@kubernetes/client-node";

export function createMssqlStatefulSetManifest(namespace: string): k8s.V1StatefulSet {
    return {
        metadata: {
            name: 'mssql',
            namespace,
            labels: {
                app: 'mssql',
                'app.kubernetes.io/name': 'mssql',
                'app.kubernetes.io/part-of': 'paas-platform'
            }
        },
        spec: {
            serviceName: 'mssql-headless',
            replicas: 1,
            selector: { matchLabels: { app: 'mssql' } },
            template: {
                metadata: {
                    labels: {
                        app: 'mssql',
                        'app.kubernetes.io/name': 'mssql',
                        'app.kubernetes.io/part-of': 'paas-platform'
                    }
                },
                spec: {
                    terminationGracePeriodSeconds: 60,
                    containers: [{
                        name: 'mssql',
                        image: 'mcr.microsoft.com/mssql/server:2022-latest',
                        ports: [{ containerPort: 1433, name: 'mssql' }],
                        env: [
                            { name: 'ACCEPT_EULA', value: 'Y' },
                            { name: 'MSSQL_PID', value: 'Developer' },
                            {
                                name: 'MSSQL_SA_PASSWORD',
                                valueFrom: {
                                    secretKeyRef: {
                                        name: 'mssql-secret',
                                        key: 'MSSQL_SA_PASSWORD'
                                    }
                                }
                            },
                            {
                                name: 'DB_NAME',
                                valueFrom: {
                                    secretKeyRef: {
                                        name: 'mssql-secret',
                                        key: 'DB_NAME'
                                    }
                                }
                            }
                        ],
                        lifecycle: {
                            postStart: {
                                exec: {
                                    command: [
                                        '/bin/bash',
                                        '-c',
                                        'for i in {1..60}; do /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -Q "IF DB_ID(\'$DB_NAME\') IS NULL CREATE DATABASE $DB_NAME;" && exit 0; sleep 2; done; exit 0'
                                    ]
                                }
                            }
                        },
                        volumeMounts: [{
                            name: 'mssql-data',
                            mountPath: '/var/opt/mssql'
                        }],
                        resources: {
                            requests: { memory: '1536Mi', cpu: '500m' },
                            limits: { memory: '2560Mi', cpu: '2000m' }
                        }
                    }]
                }
            },
            volumeClaimTemplates: [{
                metadata: { name: 'mssql-data' },
                spec: {
                    accessModes: ['ReadWriteOnce'],
                    resources: {
                        requests: { storage: '5Gi' }
                    }
                }
            }]
        }
    };
}

export function createMssqlHeadlessServiceManifest(namespace: string): k8s.V1Service {
    return {
        metadata: {
            name: 'mssql-headless',
            namespace,
            labels: { app: 'mssql', 'app.kubernetes.io/name': 'mssql' }
        },
        spec: {
            clusterIP: 'None',
            selector: { app: 'mssql' },
            ports: [{ port: 1433, targetPort: 1433, name: 'mssql' }]
        }
    };
}

export function createMssqlServiceManifest(namespace: string): k8s.V1Service {
    return {
        metadata: {
            name: 'mssql',
            namespace,
            labels: { app: 'mssql', 'app.kubernetes.io/name': 'mssql' }
        },
        spec: {
            type: 'ClusterIP',
            selector: {
                app: 'mssql',
                'statefulset.kubernetes.io/pod-name': 'mssql-0'
            },
            ports: [{ port: 1433, targetPort: 1433, name: 'mssql' }]
        }
    };
}

export function createOracleStatefulSetManifest(namespace: string): k8s.V1StatefulSet {
    return {
        metadata: {
            name: 'oracle',
            namespace,
            labels: {
                app: 'oracle',
                'app.kubernetes.io/name': 'oracle',
                'app.kubernetes.io/part-of': 'paas-platform'
            }
        },
        spec: {
            serviceName: 'oracle-headless',
            replicas: 1,
            selector: { matchLabels: { app: 'oracle' } },
            template: {
                metadata: {
                    labels: {
                        app: 'oracle',
                        'app.kubernetes.io/name': 'oracle',
                        'app.kubernetes.io/part-of': 'paas-platform'
                    }
                },
                spec: {
                    terminationGracePeriodSeconds: 90,
                    containers: [{
                        name: 'oracle',
                        image: 'gvenzl/oracle-free:latest',
                        ports: [{ containerPort: 1521, name: 'oracle' }],
                        env: [
                            {
                                name: 'APP_USER',
                                valueFrom: {
                                    secretKeyRef: {
                                        name: 'oracle-secret',
                                        key: 'APP_USER'
                                    }
                                }
                            },
                            {
                                name: 'APP_USER_PASSWORD',
                                valueFrom: {
                                    secretKeyRef: {
                                        name: 'oracle-secret',
                                        key: 'APP_USER_PASSWORD'
                                    }
                                }
                            },
                            {
                                name: 'ORACLE_PASSWORD',
                                valueFrom: {
                                    secretKeyRef: {
                                        name: 'oracle-secret',
                                        key: 'ORACLE_PASSWORD'
                                    }
                                }
                            },
                            {
                                name: 'ORACLE_DATABASE',
                                valueFrom: {
                                    secretKeyRef: {
                                        name: 'oracle-secret',
                                        key: 'ORACLE_DATABASE'
                                    }
                                }
                            }
                        ],
                        volumeMounts: [{
                            name: 'oracle-data',
                            mountPath: '/opt/oracle/oradata'
                        }],
                        resources: {
                            requests: { memory: '1024Mi', cpu: '500m' },
                            limits: { memory: '3Gi', cpu: '2000m' }
                        }
                    }]
                }
            },
            volumeClaimTemplates: [{
                metadata: { name: 'oracle-data' },
                spec: {
                    accessModes: ['ReadWriteOnce'],
                    resources: {
                        requests: { storage: '10Gi' }
                    }
                }
            }]
        }
    };
}

export function createOracleHeadlessServiceManifest(namespace: string): k8s.V1Service {
    return {
        metadata: {
            name: 'oracle-headless',
            namespace,
            labels: { app: 'oracle', 'app.kubernetes.io/name': 'oracle' }
        },
        spec: {
            clusterIP: 'None',
            selector: { app: 'oracle' },
            ports: [{ port: 1521, targetPort: 1521, name: 'oracle' }]
        }
    };
}

export function createOracleServiceManifest(namespace: string): k8s.V1Service {
    return {
        metadata: {
            name: 'oracle',
            namespace,
            labels: { app: 'oracle', 'app.kubernetes.io/name': 'oracle' }
        },
        spec: {
            type: 'ClusterIP',
            selector: {
                app: 'oracle',
                'statefulset.kubernetes.io/pod-name': 'oracle-0'
            },
            ports: [{ port: 1521, targetPort: 1521, name: 'oracle' }]
        }
    };
}
