export type FeatureFlagName = 'rate_limiting'
    | 'pgbouncer'
    | 'haproxy'
    | 'cronjob_backup'
    | 'hpa_scaling'
    | 'maintenance_mode'
    | 'vpa_scaling'
    | 'app_storage'
    | 'backup_storage';

export type InactivationStrategy = 'hot_standby' | 'scale_to_zero';

export interface FeatureWorkloadTarget {
    type: 'deployment' | 'cronjob' | 'statefulset';
    name: string;
    namespace: string;
}