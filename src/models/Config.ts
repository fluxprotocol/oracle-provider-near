import { EnvArgs } from "@fluxprotocol/oracle-provider-core/dist/Provider";
import Big from "big.js";
import BN from "bn.js";

export const PROVIDER_ID = 'near';
export const PROVIDER_NAME = 'NEAR';

export enum NetworkType {
    Mainnet = 'mainnet',
    Testnet = 'testnet'
}

export interface Config {
    validatorAccountId: string;
    oracleContractId: string;
    networkRpc: string;
    networkId: string;
    maxStakeAmount: string;
    searchInterval: number;
    maxGas: BN;
    attachedStorage: BN;
    stakeRemainderDivider: number;

    privateKey?: string;
    credentialsStorePath?: string;
}

export function parseConfig(env: EnvArgs): Config {
    return {
        privateKey: env['NEAR_PRIVATE_KEY'],
        credentialsStorePath: env['NEAR_CREDENTIALS_STORE_PATH'],
        validatorAccountId: env['NEAR_ACCOUNT_ID'] ?? '',
        networkRpc: env['NEAR_RPC'] ?? '',
        oracleContractId: env['NEAR_CONTRACT_ID'] ?? '',
        maxStakeAmount: env['NEAR_MAX_STAKE_AMOUNT'] ?? '2.5',
        searchInterval: 5_000,
        networkId: env['NEAR_NETWORK_ID'] ?? '',
        attachedStorage: new BN(env['NEAR_ATTACHED_STORAGE'] ?? '30000000000000000000000'),
        maxGas: new BN(env['NEAR_MAX_GAS'] ?? '300000000000000'),
        stakeRemainderDivider: env['NEAR_STAKE_REMAINDER_DIVIDER'] ? Number(env['NEAR_STAKE_REMAINDER_DIVIDER']) : 1,
    };
}

export function validateConfig(env: EnvArgs) {
    if (!env['NEAR_CREDENTIALS_STORE_PATH'] && !env['NEAR_PRIVATE_KEY']) {
        throw new Error(`env option "NEAR_CREDENTIALS_STORE_PATH" or "NEAR_PRIVATE_KEY" is required for ${PROVIDER_NAME}`);
    }

    if (!env['NEAR_NETWORK_ID']) {
        throw new Error(`env option "NEAR_NETWORK_ID" is required for ${PROVIDER_NAME}`);
    }

    if (!env['NEAR_ACCOUNT_ID']) {
        throw new Error(`env option "NEAR_ACCOUNT_ID" is required for ${PROVIDER_NAME}"`);
    }

    if (!env['NEAR_CONTRACT_ID']) {
        throw new Error(`env option "NEAR_CONTRACT_ID" is required for ${PROVIDER_NAME}`);
    }

    if (!env['NEAR_RPC']) {
        throw new Error(`env option "NEAR_RPC" is required for ${PROVIDER_NAME}`);
    }

    if (env['NEAR_MAX_STAKE_AMOUNT']) {
        // Checks if the number is an actual number
        new Big(env['NEAR_MAX_STAKE_AMOUNT']);
    }

    if (env['NEAR_STAKE_REMAINDER_DIVIDER']) {
        // Checks if the number is an actual number
        const value = new Big(env['NEAR_STAKE_REMAINDER_DIVIDER']);

        if (value.lt(0) || value.gt(1)) {
            throw new Error(`env option "NEAR_STAKE_REMAINDER_DIVIDER" should be between 0 and 1 (including)`);
        }
    }
}