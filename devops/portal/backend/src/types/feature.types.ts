export type FeatureFlagName = 'rate_limiting'
    | 'pgbouncer'
    | 'haproxy'
    | 'cronjob_backup'
    | 'hpa_scaling'
    | 'maintenance_mode'
    | 'vpa_scaling';

export type InactivationStrategy = 'hot_standby' | 'scale_to_zero';