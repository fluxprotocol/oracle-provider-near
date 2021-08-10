import path from 'path';
import { connect, keyStores, Near, utils } from "near-api-js";
import { Config } from "../models/Config";

export async function connectToNear(config: Config): Promise<Near> {
    let keyStore: keyStores.KeyStore | undefined;
    const networkId = config.networkId;

    if (config.credentialsStorePath) {
        const credentialsStorePath = path.resolve(config.credentialsStorePath) + path.sep;
        keyStore = new keyStores.UnencryptedFileSystemKeyStore(credentialsStorePath);
    } else if (config.privateKey) {
        const keyPair = utils.KeyPair.fromString(config.privateKey);
        keyStore = new keyStores.InMemoryKeyStore();
        keyStore.setKey(networkId, config.validatorAccountId, keyPair);
    }

    if (!keyStore) throw new Error('Key store could not be created due lack of private key');

    return connect({
        networkId,
        nodeUrl: config.networkRpc,
        deps: {
            keyStore,
        }
    });
}