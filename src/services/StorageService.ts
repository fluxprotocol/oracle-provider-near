import { ILogger } from "@fluxprotocol/oracle-provider-core/dist/Core";
import Big from "big.js";
import BN from "bn.js";
import { Account } from "near-api-js";
import { Config, PROVIDER_ID } from "../models/Config";
import cache from "../utils/cache";

/**
 * Gets the minimum amount storage required for a oracle transaction
 *
 * @export
 * @param {WalletConnection} walletConnection
 * @return {Promise<Big>}
 */
export async function getMinimumStorage(contractId: string, account: Account): Promise<Big> {
    try {
        const result = await cache(`${contractId}_minimum_storage_balance`, async () => {
            const minimumBalance = await account.viewFunction(contractId, 'storage_balance_bounds', {});
            return Big(minimumBalance.min);
        });

        return result;
    } catch (error) {
        console.error('[getMinimumStorage]', error);
        return new Big(0);
    }
}

/**
 * Get the current storage balance of the specific account
 *
 * @export
 * @param {WalletConnection} walletConnection
 * @return {Promise<{ total: Big, available: Big }>}
 */
export async function getStorageBalance(contractId: string, accountId: string, account: Account): Promise<{ total: Big, available: Big }> {
    try {
        const storage = await account.viewFunction(contractId, 'storage_balance_of', {
            account_id: accountId,
        });

        return {
            total: storage ? new Big(storage.total) : new Big(0),
            available: storage ? new Big(storage.available) : new Big(0),
        };
    } catch (error) {
        console.error('[getStorageBalance]', error);
        return {
            total: new Big(0),
            available: new Big(0),
        };
    }
}

/**
 * Creates a storage deposit transaction if it's required
 *
 * @export
 * @param {string} contractId
 * @param {string} accountId
 * @param {WalletConnection} walletConnection
 * @param {Big} extraStorage Can be used for calls that require way more than the minimum storage requirements
 * @return {(Promise<TransactionOption | null>)}
 */
export async function upgradeStorage(config: Config, logger: ILogger, account: Account, extraStorage: Big = new Big(0)): Promise<void> {
    const minimumStorageRequired = await getMinimumStorage(config.oracleContractId, account);
    const storageBalance = await getStorageBalance(config.oracleContractId, config.validatorAccountId, account);
    const storageRequired = minimumStorageRequired.add(extraStorage);

    if (!storageBalance.available.lt(storageRequired)) {
        return;
    }
    
    const storageDeposit = storageRequired.sub(storageBalance.available).toString();
    logger.debug(`${PROVIDER_ID} - current deposited storage (${storageBalance.available.toString()}) is less then ${storageRequired.toString()}, adding ${storageDeposit}`);

    await account.functionCall({
        contractId: config.oracleContractId,
        methodName: 'storage_deposit',
        args: {
            account_id: config.validatorAccountId,
        },
        gas: config.maxGas,
        attachedDeposit: new BN(storageDeposit),
    });
}
