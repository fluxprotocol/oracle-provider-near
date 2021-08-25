import { Outcome, OutcomeType } from '@fluxprotocol/oracle-provider-core/dist/Outcome';
import Big from 'big.js';
import { DataRequestDataType } from '../../../oracle-provider-core/dist/DataRequestDataType';

export interface OutcomeNumber {
    Number: {
        value: string;
        multiplier: string;
        negative: boolean;
    }
}

export interface OutcomeString {
    String: string;
}

export interface ValidOutcome {
    Answer: OutcomeNumber | OutcomeString;
}

export type NearOutcome = 'Invalid' | ValidOutcome;

export function isSameOutcome(a: NearOutcome, b: NearOutcome): boolean {
    if (typeof a === 'string' && typeof b !== 'string') {
        return false;
    }

    if (typeof a === 'string' || typeof b === 'string') {
        return a === b;
    }

    return JSON.stringify(a) === JSON.stringify(b);
}

export function transformToOutcome(nearOutcome: NearOutcome): Outcome {
    if (nearOutcome === 'Invalid') {
        return {
            type: OutcomeType.Invalid,
        };
    }

    if ('String' in nearOutcome.Answer) {
        return {
            answer: nearOutcome.Answer.String,
            type: OutcomeType.Answer,
        };
    }

    const number = new Big(nearOutcome.Answer.Number.value);

    if (nearOutcome.Answer.Number.negative) {
        number.s = -1;
    }

    return {
        answer: number.toString(),
        type: OutcomeType.Answer,
    };
}

export function transformToNearOutcome(outcome: Outcome, dataType: DataRequestDataType): NearOutcome {
    if (outcome.type === OutcomeType.Invalid) {
        return 'Invalid';
    }

    if (dataType.type === 'string') {
        return {
            Answer: {
                String: outcome.answer,
            },
        };
    }

    let number = new Big(outcome.answer);
    const isNegative = number.lt(0);

    if (isNegative) {
        number = number.mul(-1);
    }

    const ans = {
        Answer: {
            Number: {
                value: number.toFixed(0),
                multiplier: dataType.multiplier,
                negative: isNegative,
            },
        },
    };
    
    return ans;
}