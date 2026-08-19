export type AlertCondition = 'ABOVE' | 'BELOW';
export type AlertOutcome = 'fire' | 'rearm' | 'none';

const REARM_BAND = 0.03; // 3%

export function evaluateAlertState(
    condition: AlertCondition,
    targetPrice: number,
    currentPrice: number,
    // `.lean()` reads skip Mongoose schema defaults, so a legacy alert
    // document (or one inserted outside Mongoose) comes back with `armed`
    // as `undefined` rather than the schema's default of `true` — treat
    // anything but an explicit `false` as armed.
    armed: boolean | undefined
): AlertOutcome {
    if (armed !== false) {
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
