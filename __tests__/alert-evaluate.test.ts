import { describe, expect, it } from 'vitest';
import { evaluateAlertState } from '@/lib/alerts/evaluate';

describe('evaluateAlertState', () => {
    describe('ABOVE condition', () => {
        it('fires when armed and price meets or exceeds target', () => {
            expect(evaluateAlertState('ABOVE', 100, 100, true)).toBe('fire');
            expect(evaluateAlertState('ABOVE', 100, 105, true)).toBe('fire');
        });

        it('does not fire when armed but price is below target', () => {
            expect(evaluateAlertState('ABOVE', 100, 99, true)).toBe('none');
        });

        it('does not fire when not armed, even if the condition is met', () => {
            expect(evaluateAlertState('ABOVE', 100, 105, false)).toBe('none');
        });

        it('rearms when unarmed and price falls 3% or more below target', () => {
            expect(evaluateAlertState('ABOVE', 100, 97, false)).toBe('rearm');
            expect(evaluateAlertState('ABOVE', 100, 90, false)).toBe('rearm');
        });

        it('stays unarmed when price has not cleared the 3% band', () => {
            expect(evaluateAlertState('ABOVE', 100, 98, false)).toBe('none');
        });
    });

    describe('BELOW condition', () => {
        it('fires when armed and price meets or drops below target', () => {
            expect(evaluateAlertState('BELOW', 100, 100, true)).toBe('fire');
            expect(evaluateAlertState('BELOW', 100, 95, true)).toBe('fire');
        });

        it('does not fire when armed but price is above target', () => {
            expect(evaluateAlertState('BELOW', 100, 101, true)).toBe('none');
        });

        it('does not fire when not armed, even if the condition is met', () => {
            expect(evaluateAlertState('BELOW', 100, 95, false)).toBe('none');
        });

        it('rearms when unarmed and price rises 3% or more above target', () => {
            expect(evaluateAlertState('BELOW', 100, 103, false)).toBe('rearm');
            expect(evaluateAlertState('BELOW', 100, 110, false)).toBe('rearm');
        });

        it('stays unarmed when price has not cleared the 3% band', () => {
            expect(evaluateAlertState('BELOW', 100, 102, false)).toBe('none');
        });
    });

    describe('undefined armed (legacy documents read via .lean())', () => {
        it('treats undefined as armed and fires when the condition is met', () => {
            expect(evaluateAlertState('BELOW', 100, 95, undefined)).toBe('fire');
            expect(evaluateAlertState('ABOVE', 100, 105, undefined)).toBe('fire');
        });

        it('treats undefined as armed and does not fire when the condition is not met', () => {
            expect(evaluateAlertState('BELOW', 100, 101, undefined)).toBe('none');
            expect(evaluateAlertState('ABOVE', 100, 99, undefined)).toBe('none');
        });
    });
});
