import * as k8s from "@kubernetes/client-node";
import type { CreateJMeterJobParams } from "../types/resilience.types.js";

export const createJMeterJobManifest = ({
    jobName,
    scenario,
    targetHost,
    targetPort,
    duration,
    threads
}: CreateJMeterJobParams): k8s.V1Job => ({
    apiVersion: 'batch/v1',
    kind: 'Job',
    metadata: {
        name: jobName,
        namespace: 'platform-infra',
        labels: {
            app: 'jmeter-loadtest',
            'app.kubernetes.io/part-of': 'paas-resilience',
            scenario
        }
    },
    spec: {
        ttlSecondsAfterFinished: 300,
        backoffLimit: 0,
        activeDeadlineSeconds: 600,
        template: {
            metadata: {
                labels: {
                    app: 'jmeter-loadtest',
                    'app.kubernetes.io/part-of': 'paas-resilience'
                }
            },
            spec: {
                restartPolicy: 'Never',
                containers: [
                    {
                        name: 'jmeter-loadtest',
                        image: 'justb4/jmeter:5.5',
                        command: ['/bin/bash', '/scenarios/run-test.sh'],
                        args: [scenario],
                        env: [
                            { name: 'SCENARIO', value: scenario },
                            { name: 'TARGET_HOST', value: targetHost },
                            { name: 'TARGET_PORT', value: targetPort },
                            { name: 'DURATION', value: duration },
                            { name: 'THREADS', value: threads }
                        ],
                        resources: {
                            requests: { cpu: '250m', memory: '512Mi' },
                            limits: { cpu: '1000m', memory: '1024Mi' }
                        },
                        volumeMounts: [
                            { name: 'scenarios', mountPath: '/scenarios', readOnly: true },
                            { name: 'results', mountPath: '/results' }
                        ]
                    }
                ],
                volumes: [
                    {
                        name: 'scenarios',
                        configMap: { name: 'jmeter-scenarios', defaultMode: 0o755 }
                    },
                    { name: 'results', emptyDir: {} }
                ]
            }
        }
    }
});
