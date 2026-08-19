export type AlertCondition = 'ABOVE' | 'BELOW';
export type AlertOutcome = 'fire' | 'rearm' | 'none';

const REARM_BAND = 0.03; // 3%

export function evaluateAlertState(
    condition: AlertCondition,
    targetPrice: number,
    currentPrice: number,
    armed: boolean
): AlertOutcome {
    if (armed) {
        const fireConditionMet =
            condition === 'ABOVE' ? currentPrice >= targetPrice : currentPrice <= targetPrice;
        return fireConditionMet ? 'fire' : 'none';
    }

    const rearmConditionMet =
        condition === 'ABOVE'
            ? currentPrice <= targetPrice * (1 - REARM_BAND)
            : currentPrice >= targetPrice * (1 + REARM_BAND);
    return rearmConditionMet ? 'rearm' : 'none';
}
