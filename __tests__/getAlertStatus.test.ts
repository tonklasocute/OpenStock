import { describe, expect, it } from 'vitest';
import { getAlertStatus } from '@/lib/getAlertStatus';

describe('getAlertStatus', () => {
    it('is "triggered" once an alert has fired, even if still active', () => {
        expect(getAlertStatus({ active: true, triggered: true })).toBe('triggered');
    });

    it('is "triggered" for a fired alert that was also deactivated', () => {
        expect(getAlertStatus({ active: false, triggered: true })).toBe('triggered');
    });

    it('is "paused" for a deactivated alert that never fired', () => {
        expect(getAlertStatus({ active: false, triggered: false })).toBe('paused');
    });

    it('is "active" for a live, unfired alert', () => {
        expect(getAlertStatus({ active: true, triggered: false })).toBe('active');
    });
});
