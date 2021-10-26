import { ILogger } from "@fluxprotocol/oracle-provider-core/dist/Core";
import DataRequest from "@fluxprotocol/oracle-provider-core/dist/DataRequest";
import RpcService from "./RpcService";
import { PROVIDER_ID } from '../models/Config';

export function listenForRequests(rpc: RpcService, logger: ILogger, startingRequestId: string, onRequests: (requests: DataRequest[]) => void) {
    let currentRequestId = startingRequestId;

    return setInterval(async () => {
        logger.debug(`${PROVIDER_ID} - Search tick triggered`);
        const newRequests = await rpc.getRequests(currentRequestId);
        const lastRequest = newRequests[newRequests.length - 1];

        if (lastRequest) {
            currentRequestId = lastRequest.id;
            onRequests(newRequests);
        }
    }, rpc.config.searchInterval);
}

export async function syncRequests(rpc: RpcService, logger: ILogger, startingRequestId: string | undefined, onRequests: (requests: DataRequest[]) => void) {
    let hasMore = true;
    let currentRequestId = startingRequestId;

    logger.debug(`${PROVIDER_ID} - Syncing starting from ${currentRequestId}`);

    while (hasMore) {
        let requests = await rpc.getRequests(currentRequestId ?? '0');

        if (currentRequestId) {
            // We are not syncing from scratch
            // So we must delete the ids that we already have
            requests = requests.slice(1);
        }

        if (!requests.length) {
            logger.debug(`${PROVIDER_ID} - No more to sync`);
            hasMore = false;
            return;
        }

        currentRequestId = requests[requests.length - 1]!.id;
        logger.debug(`${PROVIDER_ID} - Next id: ${currentRequestId}`);
        onRequests(requests);
    }
}