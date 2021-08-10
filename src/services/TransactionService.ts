import { providers } from "near-api-js";
import { parseJson } from "../utils/jsonUtils";

export function isTransactionFailure(executionOutcome: providers.FinalExecutionOutcome) {
    return executionOutcome.receipts_outcome.some((receipt) => {
        if (typeof receipt.outcome.status === 'string') {
            return false;
        }

        if (receipt.outcome.status?.Failure) {
            return true;
        }

        return false;
    });
}

export function extractLogs(executionOutcome: providers.FinalExecutionOutcome): any[] {
    const logs: any[] = [];

    executionOutcome.receipts_outcome.forEach((receipt) => {
        receipt.outcome.logs.forEach((log) => {
            const json = parseJson(log);

            if (json) {
                logs.push(json);
            }
        });
    });

    return logs;
}