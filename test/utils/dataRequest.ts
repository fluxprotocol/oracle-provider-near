import DataRequest from "@fluxprotocol/oracle-provider-core/dist/DataRequest";

export default function createDummyDataRequest(request: Partial<DataRequest> = {}): DataRequest {
    return {
        dataType: { type: 'string' },
        finalArbitratorTriggered: false,
        id: '1',
        internalId: 'near_test.near_1',
        outcomes: [],
        providerId: 'near',
        resolutionWindows: [],
        sources: [],
        staking: [],
        tags: [],
        requester: '',
        config: {
            paidFee: '1',
            validityBond: '1',
            ...request.config,
        },
        ...request,
    }
}