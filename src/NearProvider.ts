import { Near } from "near-api-js";
import Balance from '@fluxprotocol/oracle-provider-core/dist/Balance';
import { toToken } from '@fluxprotocol/oracle-provider-core/dist/Token';
import DataRequest, { calcStakeAmount, getCurrentResolutionWindow } from '@fluxprotocol/oracle-provider-core/dist/DataRequest';
import Provider, { EnvArgs, ProviderDependencies } from '@fluxprotocol/oracle-provider-core/dist/Provider';
import { ClaimError, ClaimResult, ClaimResultType } from '@fluxprotocol/oracle-provider-core/dist/ClaimResult';
import { getRequestOutcome, isOutcomesEqual, Outcome } from '@fluxprotocol/oracle-provider-core/dist/Outcome';
import { StakeError, StakeResult, StakeResultType } from '@fluxprotocol/oracle-provider-core/dist/StakeResult';
import Big from "big.js";
import BN from "bn.js";

import { Config, parseConfig, PROVIDER_ID, PROVIDER_NAME, validateConfig } from "./models/Config";
import { connectToNear } from "./services/ConnectService";
import RpcService from "./services/RpcService";
import { getAccount } from "./services/AccountService";
import { listenForRequests, syncRequests } from "./services/RequestService";
import { transformToNearOutcome } from "./models/NearOutcome";
import { upgradeStorage } from "./services/StorageService";
import { extractLogs, isTransactionFailure } from "./services/TransactionService";
import { claimBackUnbondedStake } from "./services/StakeService";

Big.PE = 100_000;

export default class NearProvider implements Provider {
    providerName = PROVIDER_NAME;
    id = PROVIDER_ID;
    static id = PROVIDER_ID;

    config: Config;
    rpc?: RpcService;

    near?: Near;
    currentRequestId?: string;

    /** Keeping track of balances, will fill in contract at init() */
    balance: Balance;

    constructor(env: EnvArgs, private dependencies: ProviderDependencies) {
        validateConfig(env);
        this.config = parseConfig(env);
        this.balance = new Balance(dependencies.database, 'near_balance', 'FLX', 18, '');
    }

    getAccountId() {
        return this.config.validatorAccountId;
    }

    async init() {
        this.near = await connectToNear(this.config);
        const account = await getAccount(this.near, this.config.validatorAccountId);
        this.rpc = new RpcService(this.config, account, this.dependencies.logger);
        
        const oracleConfig = await this.rpc.getOracleConfig();
        await this.balance.restore();
        
        // Reset the stakeAmount to the correct decimals
        // We can't do this in parseConfig due the unknown decimals
        this.config.maxStakeAmount = toToken(this.config.maxStakeAmount, oracleConfig.stakeToken.decimals);
        
        this.balance.symbol = oracleConfig.stakeToken.symbol;
        this.balance.decimals = oracleConfig.stakeToken.decimals;
        this.balance.contractId = oracleConfig.stakeToken.contractId;
    
        // Set the balance to the correct amount
        await this.getBalanceInfo();

        // Keep balances updated
        setInterval(() => this.getBalanceInfo(), 10_000);
    }

    async getBalanceInfo(): Promise<Balance> {
        try {
            this.dependencies.logger.debug(`${PROVIDER_ID} - Refreshing balances`);
            const balance = await this.rpc!.getTokenBalance(this.balance.contractId, this.config.validatorAccountId);
            this.balance.resetBalance(balance, this.balance.symbol, this.balance.decimals);
            await this.balance.save();
            return this.balance;
        } catch (error) {
            this.dependencies.logger.error(`${PROVIDER_ID} - getTokenBalance - ${error}`);
            return this.balance;
        }
    }

    async getDataRequestById(requestId: string): Promise<DataRequest | undefined> {
        try {
            const dataRequest = await this.rpc!.getRequestById(requestId);
            return dataRequest;
        } catch (error) {
            this.dependencies.logger.error(`${PROVIDER_ID} - getDataRequestById - ${error}`);
            return undefined;
        }
    }

    listenForRequests(onRequests: (requests: DataRequest[]) => void) {
        listenForRequests(this.rpc!, this.dependencies.logger, this.currentRequestId ?? '0', (requests) => {
            onRequests(requests);
        });
    }

    async claim(request: DataRequest): Promise<ClaimResult> {
        try {
            const account = await getAccount(this.near!, this.config.validatorAccountId);
            const amountUnbonded = await claimBackUnbondedStake(this.config, request, account);
            const requestOutcome = getRequestOutcome(request);

            // Any unbonded stake can be claimed back safely
            this.balance.unstake(request.id, amountUnbonded.toString());
    
            if (request.finalizedOutcome && !isOutcomesEqual(request.finalizedOutcome, requestOutcome)) {
                this.dependencies.logger.debug(`${request.internalId} - Slashed due outcome not being the same`);

                // We staked on the wrong outcome, we got slashed
                this.balance.slashSelf(request.id);
    
                // The function call is a success, but we did got slashed
                return {
                    received: '0',
                    type: ClaimResultType.Success,
                };
            }
    
            // First upgrade our storage if required
            await upgradeStorage(this.config, this.dependencies.logger, account);

            const claimTransactionResult = await account.functionCall({
                contractId: this.config.oracleContractId,
                methodName: 'dr_claim',
                args: {
                    request_id: request.id,
                    account_id: this.config.validatorAccountId
                },
                gas: this.config.maxGas,
                attachedDeposit: this.config.attachedStorage,
            });

            if (isTransactionFailure(claimTransactionResult)) {
                // Something happend that we didn't catch
                // It's best to assume that the stake is gone, the balance will restore itself in the next tick
                this.balance.slashSelf(request.id);

                return {
                    type: ClaimResultType.Error,
                    error: ClaimError.Unknown,
                }
            }
    
            const logs = extractLogs(claimTransactionResult);
            const claimLog = logs.find(log => log.type === 'claims');
            const profit = new Big(claimLog?.params.payout ?? '0');
    
            // Technicaly we unstake the correct amount of stake
            const correctStake = new Big(claimLog?.params.user_correct_stake ?? '0');
            const totalAmountUnstaked = amountUnbonded.add(correctStake);
            const totalReceived = totalAmountUnstaked.add(profit);
    
            this.balance.unstake(request.id, correctStake.toString());
            this.balance.addProfit(profit.toString());
            await this.balance.save();
    
            return {
                received: totalReceived.toString(),
                type: ClaimResultType.Success
            };
        } catch (error) {
            this.balance.slashSelf(request.id);

            return {
                type: ClaimResultType.Error,
                error: ClaimError.Unknown,
            };
        }
    }

    async finalize(request: DataRequest): Promise<boolean> {
        const account = await getAccount(this.near!, this.config.validatorAccountId);

        // First upgrade our storage if required
        await upgradeStorage(this.config, this.dependencies.logger, account);

        // First party oracle
        if (request.allowedValidators.length) {
            if (request.executeResult && request.allowedValidators.includes(account.accountId)) {
                const nearOutcome = transformToNearOutcome(getRequestOutcome(request), request.dataType);
                
                const finalizeTransaction = await account.functionCall({
                    contractId: this.config.oracleContractId,
                    methodName: 'dr_finalize_by_provider',
                    args: {
                        request_id: request.id,
                        outcome: nearOutcome,
                    },
                    gas: this.config.maxGas,
                    attachedDeposit: new BN(0)
                });

                return !isTransactionFailure(finalizeTransaction);
            }

            return false;
        }

        const finalizeTransaction = await account.functionCall({
            contractId: this.config.oracleContractId,
            methodName: 'dr_finalize',
            args: {
                request_id: request.id,
            },
            gas: this.config.maxGas,
            attachedDeposit: new BN(0)
        });

        return !isTransactionFailure(finalizeTransaction);
    }

    async stake(request: DataRequest, outcome: Outcome): Promise<StakeResult> {
        // Withdraw stake from the account and add it to the staked balance
        const stakeAmount = new Big(calcStakeAmount(request, this.balance.balance.toString(), this.config.maxStakeAmount, this.config.stakeRemainderDivider));
        const canStake = this.balance.stake(request.id, stakeAmount.toString());

        if (!canStake) {
            return {
                type: StakeResultType.Error,
                error: StakeError.NotEnoughBalance,
            }
        }

        const account = await getAccount(this.near!, this.config.validatorAccountId);
        const nearOutcome = transformToNearOutcome(outcome, request.dataType);
        
        // First upgrade our storage if required
        await upgradeStorage(this.config, this.dependencies.logger, account);

        // TODO: The token contract id (balance.contractId) should be dynamically set
        // we should ask the data request for which token is used
        const response = await account.functionCall({
            methodName: 'ft_transfer_call',
            contractId: this.balance.contractId,
            attachedDeposit: new BN('1'),
            gas: this.config.maxGas,
            args: {
                receiver_id: this.config.oracleContractId,
                amount: stakeAmount.toString(),
                msg: JSON.stringify({
                    'StakeDataRequest': {
                        id: request.id,
                        outcome: nearOutcome,
                    }
                }),
            },
        });

        if (isTransactionFailure(response)) {
            this.balance.unstake(request.id, stakeAmount.toString());

            return {
                type: StakeResultType.Error,
                error: StakeError.TransactionFailure,
            }
        }

        const logs = extractLogs(response);
        const userStake = logs.find(log => log.type === 'user_stakes');

        if (!userStake) {
            this.balance.unstake(request.id, stakeAmount.toString());

            return {
                type: StakeResultType.Error,
                error: StakeError.Unknown,
            };
        }

        // Put back any unstaked FLX
        const amountBack = stakeAmount.sub(userStake.params.total_stake).toString();
        this.balance.unstake(request.id, amountBack);

        return {
            type: StakeResultType.Success,
            amount: userStake.params.total_stake,
            roundId: getCurrentResolutionWindow(request)?.round ?? 0,
        };
    }

    async sync(startingRequestId: string | undefined, onRequest: (request: DataRequest) => void): Promise<void> {
        // Set the starting point for other requests
        this.currentRequestId = startingRequestId;

        return syncRequests(this.rpc!, this.dependencies.logger, this.currentRequestId, (requests) => {
            requests.forEach((request) => {
                this.currentRequestId = request.id;
                onRequest(request);
            });
        });
    }
}
