export type AlertStatus = 'active' | 'triggered' | 'paused';

export function getAlertStatus(alert: { active: boolean; triggered: boolean }): AlertStatus {
    if (alert.triggered) return 'triggered';
    if (!alert.active) return 'paused';
    return 'active';
}
