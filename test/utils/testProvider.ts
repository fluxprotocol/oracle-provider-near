import NearProvider from "../../src/NearProvider";

const ORACLE_CONTRACT_ID = 'oracleinternal3.franklinwaller2.testnet';

export default function createNearProvider() {
    return new NearProvider({
        'NEAR_PRIVATE_KEY': 'ed25519:5vzF7zBgPqFj8Ebe5jaFr7eC6Aih9PWueB6QrRCUURpSzzD4CFLiby8WfoxFDeX68eMm16Jzcrju85PKmaQAkapa',
        'NEAR_ACCOUNT_ID': 'b89980e96b7e3f9f7ba3da3a2cc98c34d363925a6bfa76802d50733728a09a53',
        'NEAR_RPC': 'https://rpc.testnet.near.org',
        'NEAR_CONTRACT_ID': ORACLE_CONTRACT_ID,
    });

}