import DataRequest from "@fluxprotocol/oracle-provider-core/dist/DataRequest";
import RpcService from "./RpcService";

export function listenForRequests(rpc: RpcService, startingRequestId: string, onRequests: (requests: DataRequest[]) => void) {
    let currentRequestId = startingRequestId;

    return setInterval(async () => {
        const newRequests = await rpc.getRequests(currentRequestId);
        const lastRequest = newRequests[newRequests.length - 1];

        if (lastRequest) {
            currentRequestId = lastRequest.id;
            onRequests(newRequests);
        }
    }, rpc.config.searchInterval);
}

export async function syncRequests(rpc: RpcService, startingRequestId: string | undefined, onRequests: (requests: DataRequest[]) => void) {
    let hasMore = true;
    let currentRequestId = startingRequestId;

    while (hasMore) {
        let requests = await rpc.getRequests(currentRequestId ?? '0');

        if (currentRequestId) {
            // We are not syncing from scratch
            // So we must delete the ids that we already have
            requests = requests.slice(1);
        }

        if (!requests.length) {
            hasMore = false;
            return;
        }

        currentRequestId = requests[requests.length - 1]!.id;
        onRequests(requests);
    }
}