import DataRequest from "@fluxprotocol/oracle-provider-core/dist/DataRequest";
import { BN } from "bn.js";
import { Account, providers } from "near-api-js";
import { getRequestOutcome, isOutcomesEqual } from "@fluxprotocol/oracle-provider-core/dist/Outcome";
import { Config } from "../models/Config";
import { transformToNearOutcome } from "../models/NearOutcome";

export function claimBackUnbondedStake(config: Config, request: DataRequest, account: Account): Promise<providers.FinalExecutionOutcome>[] {
    const requestOutcome = getRequestOutcome(request);
    const transactions: Promise<providers.FinalExecutionOutcome>[] = [];

    request.staking.forEach((stake) => {
        const resolutionWindow = request.resolutionWindows[stake.roundId];

        if (!resolutionWindow) {
            return;
        }

        if (!resolutionWindow.bondedOutcome || !isOutcomesEqual(resolutionWindow.bondedOutcome, requestOutcome)) {
            transactions.push(
                account.functionCall(config.oracleContractId, 'dr_unstake', {
                    request_id: request.id,
                    resolution_round: stake.roundId,
                    outcome: transformToNearOutcome(requestOutcome, request.dataType),
                    amount: stake.amount,
                }, new BN(config.maxGas), new BN('1')),
            );
        }
    });

    return transactions;
}