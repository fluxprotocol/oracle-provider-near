import { Near } from "near-api-js";
import Balance from '@fluxprotocol/oracle-provider-core/dist/Balance';
import { toToken } from '@fluxprotocol/oracle-provider-core/dist/Token';
import DataRequest, { getCurrentResolutionWindow } from '@fluxprotocol/oracle-provider-core/dist/DataRequest';
import Provider, { EnvArgs } from '@fluxprotocol/oracle-provider-core/dist/Provider';
import { ClaimResult, ClaimResultType } from '@fluxprotocol/oracle-provider-core/dist/ClaimResult';
import { Outcome } from '@fluxprotocol/oracle-provider-core/dist/Outcome';
import { StakeError, StakeResult, StakeResultType } from '@fluxprotocol/oracle-provider-core/dist/StakeResult';
import Big from "big.js";
import { BN } from "bn.js";

import { Config, parseConfig, PROVIDER_ID, PROVIDER_NAME, validateConfig } from "./models/Config";
import { connectToNear } from "./services/ConnectService";
import RpcService from "./services/RpcService";
import { getAccount } from "./services/AccountService";
import { listenForRequests, syncRequests } from "./services/RequestService";
import { transformToNearOutcome } from "./models/NearOutcome";
import { upgradeStorage } from "./services/StorageService";
import { extractLogs, isTransactionFailure } from "./services/TransactionService";
import { claimBackUnbondedStake } from "./services/StakeService";

export default class NearProvider implements Provider {
    providerName = PROVIDER_NAME;
    id = PROVIDER_ID;
    static id = PROVIDER_ID;

    config: Config;
    rpc?: RpcService;

    near?: Near;
    currentRequestId?: string;

    balance: Balance = new Balance('FLX', 18, '');

    constructor(env: EnvArgs) {
        validateConfig(env);
        this.config = parseConfig(env);
    }

    async init() {
        this.near = await connectToNear(this.config);
        const account = await getAccount(this.near, this.config.validatorAccountId);
        this.rpc = new RpcService(this.config, account);
        
        const oracleConfig = await this.rpc.getOracleConfig();
        
        // Reset the stakeAmount to the correct decimals
        this.config.stakeAmount = toToken(this.config.stakeAmount, oracleConfig.stakeToken.decimals);
        this.balance.symbol = oracleConfig.stakeToken.symbol;
        this.balance.decimals = oracleConfig.stakeToken.decimals;
        this.balance.contractId = oracleConfig.stakeToken.contractId;
    
        // Set the balance to the correct amount
        await this.getBalanceInfo();
    }

    async getBalanceInfo(): Promise<Balance> {
        try {
            const balance = await this.rpc!.getTokenBalance(this.balance.contractId, this.config.validatorAccountId);
            this.balance.resetBalance(balance);
            return this.balance;
        } catch (error) {
            console.error('[getTokenBalance]', error);
            return this.balance;
        }
    }

    async getDataRequestById(requestId: string): Promise<DataRequest | undefined> {
        try {
            const dataRequest = await this.rpc!.getRequestById(requestId);
            return dataRequest;
        } catch (error) {
            console.error('[getDataRequestById]', error);
            return undefined;
        }
    }

    listenForRequests(onRequests: (requests: DataRequest[]) => void) {
        listenForRequests(this.rpc!, this.currentRequestId ?? '0', (requests) => {
            onRequests(requests);
        });
    }

    async claim(request: DataRequest): Promise<ClaimResult> {
        const account = await getAccount(this.near!, this.config.validatorAccountId);
        await Promise.all(claimBackUnbondedStake(this.config, request, account));

        // First upgrade our storage if required
        await upgradeStorage(this.config, account);

        const result = await account.functionCall(this.config.oracleContractId, 'dr_claim', {
            request_id: request.id,
            account_id: this.config.validatorAccountId
        }, this.config.maxGas, this.config.attachedStorage);

        const logs = extractLogs(result);
        const claimLog = logs.find(log => log.type === 'claims');
        const profit = new Big(claimLog?.params.payout ?? '0');
        const correctStake = new Big(claimLog?.params.user_correct_stake ?? '0');

        return {
            received: profit.add(correctStake).toString(),
            type: ClaimResultType.Success
        };
    }

    async finalize(request: DataRequest): Promise<boolean> {
        const account = await getAccount(this.near!, this.config.validatorAccountId);

        // First upgrade our storage if required
        await upgradeStorage(this.config, account);

        const finalizeTransaction = await account.functionCall(this.config.oracleContractId, 'dr_finalize', {
            request_id: request.id,
        }, this.config.maxGas, new BN(0));

        return !isTransactionFailure(finalizeTransaction);
    }

    async stake(request: DataRequest, outcome: Outcome): Promise<StakeResult> {
        // Withdraw stake from the account and add it to the staked balance
        const canStake = this.balance.stake(this.config.stakeAmount);

        if (!canStake) {
            return {
                type: StakeResultType.Error,
                error: StakeError.NotEnoughBalance,
            }
        }

        const account = await getAccount(this.near!, this.config.validatorAccountId);
        const nearOutcome = transformToNearOutcome(outcome, request.dataType);
        
        // First upgrade our storage if required
        await upgradeStorage(this.config, account);

        // TODO: The token contract id (balance.contractId) should be dynamically set
        // we should ask the data request for which token is used
        const response = await account.functionCall(this.balance.contractId, 'ft_transfer_call', {
            receiver_id: this.config.oracleContractId,
            amount: this.config.stakeAmount,
            msg: JSON.stringify({
                'StakeDataRequest': {
                    id: request.id,
                    outcome: nearOutcome,
                }
            }),
        }, this.config.maxGas, new BN('1'));

        if (isTransactionFailure(response)) {
            return {
                type: StakeResultType.Error,
                error: StakeError.TransactionFailure,
            }
        }

        const logs = extractLogs(response);
        const userStake = logs.find(log => log.type === 'user_stakes');

        if (!userStake) {
            return {
                type: StakeResultType.Error,
                error: StakeError.Unknown,
            };
        }

        // Put back any unstaked FLX
        const amountBack = new Big(this.config.stakeAmount).sub(userStake.params.total_stake).toString();
        this.balance.deposit(amountBack);

        return {
            type: StakeResultType.Success,
            amount: userStake.params.total_stake,
            roundId: getCurrentResolutionWindow(request)?.round ?? 0,
        };
    }

    async sync(startingRequestId: string | undefined, onRequest: (request: DataRequest) => void): Promise<void> {
        // Set the starting point for other requests
        this.currentRequestId = startingRequestId;

        return syncRequests(this.rpc!, this.currentRequestId, (requests) => {
            requests.forEach((request) => {
                this.currentRequestId = request.id;
                onRequest(request);
            });
        });
    }
}
