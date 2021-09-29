import DataRequest from "@fluxprotocol/oracle-provider-core/dist/DataRequest";
import BN from "bn.js";
import { Account, providers } from "near-api-js";
import { getRequestOutcome, isOutcomesEqual } from "@fluxprotocol/oracle-provider-core/dist/Outcome";
import { Config } from "../models/Config";
import { transformToNearOutcome } from "../models/NearOutcome";
import Big from "big.js";

export async function claimBackUnbondedStake(config: Config, request: DataRequest, account: Account): Promise<Big> {
    const requestOutcome = getRequestOutcome(request);
    const transactions: Promise<providers.FinalExecutionOutcome>[] = [];
    let totalUnbondedStake: Big = new Big(0);

    request.staking.forEach((stake) => {
        const resolutionWindow = request.resolutionWindows[stake.roundId];

        if (!resolutionWindow) {
            return;
        }

        if (!resolutionWindow.bondedOutcome || !isOutcomesEqual(resolutionWindow.bondedOutcome, requestOutcome)) {
            totalUnbondedStake = totalUnbondedStake.add(stake.amount);
            
            transactions.push(
                account.functionCall({
                    contractId: config.oracleContractId,
                    methodName: 'dr_unstake',
                    args: {
                        request_id: request.id,
                        resolution_round: stake.roundId,
                        outcome: transformToNearOutcome(requestOutcome, request.dataType),
                        amount: stake.amount,
                    },
                    gas: config.maxGas,
                    attachedDeposit: new BN(1),
                }),
            );
        }
    });

    await Promise.all(transactions);

    return totalUnbondedStake;
}