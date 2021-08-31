import DataRequest, { buildInternalId } from '@fluxprotocol/oracle-provider-core/dist/DataRequest';
import { toToken } from '@fluxprotocol/oracle-provider-core/dist/Token';
import { nsToMs } from '../utils/nsToMs';
import { PROVIDER_ID } from './Config';
import { NearOutcome, transformToOutcome } from "./NearOutcome";


export interface NearRequestResolutionWindow {
    round: number;
    start_time: string;
    end_time: string;
    bond_size: string;
    bonded_outcome: NearOutcome | null;
}

export interface NearRequestSource {
    end_point: string;
    source_path: string;
}

export type NearRequestType = "String" | { Number: string };

export interface NearRequest {
    id: string;
    description: string | null;
    sources: NearRequestSource[],
    outcomes: string[] | null;
    requestor: string;
    creator: string;
    finalized_outcome: NearOutcome | null;
    resolution_windows: NearRequestResolutionWindow[];
    global_config_id: string;
    initial_challenge_period: string;
    final_arbitrator_triggered: boolean;
    target_contract: string;
    tags: string[];
    paid_fee: string | null;
    data_type: NearRequestType;
    request_config?: {
        validity_bond?: string;
        paid_fee?: string;
        stake_multiplier?: number;
    },
}

export function transformToDataRequest(request: NearRequest): DataRequest {
    // TODO: We also might want to encode the token contract id in the metadata
    return {
        id: request.id.toString(),
        internalId: buildInternalId(request.id, PROVIDER_ID, ''),
        dataType: request.data_type === 'String' ? { type: 'string' } : { type: 'number', multiplier: request.data_type.Number },
        finalArbitratorTriggered: request.final_arbitrator_triggered,
        outcomes: request.outcomes ?? [],
        sources: request.sources,
        providerId: PROVIDER_ID,
        finalizedOutcome: request.finalized_outcome ? transformToOutcome(request.finalized_outcome) : undefined,
        staking: [],
        config: {
            paidFee: request.request_config?.paid_fee ?? '0',
            validityBond: request.request_config?.validity_bond ?? '0',
            stakeMultiplier: request.request_config?.stake_multiplier,
        },
        paidFee: request.paid_fee ?? undefined,
        resolutionWindows: request.resolution_windows.map(rw => ({
            round: rw.round,
            bondSize: rw.bond_size,
            startTime: new Date(nsToMs(Number(rw.start_time))),
            endTime: new Date(nsToMs(Number(rw.end_time))),
            bondedOutcome: rw.bonded_outcome ? transformToOutcome(rw.bonded_outcome) : undefined,
        })),
    };
}