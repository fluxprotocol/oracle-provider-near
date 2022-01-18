import DataRequest, { buildInternalId, RequestInfo } from '@fluxprotocol/oracle-provider-core/dist/DataRequest';
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

interface HttpAttributes {
    http_body?: string;
    http_headers?: {
        [key: string]: string;
    },
}

interface NearHttpInstructions {
    Get: HttpAttributes;
    Head: HttpAttributes;
    Post: HttpAttributes;
    Put: HttpAttributes;
    Delete: HttpAttributes;
    Connect: HttpAttributes;
    Options: HttpAttributes;
    Trace: HttpAttributes;
    Patch: HttpAttributes;
}

type HttpMethod = keyof NearHttpInstructions;

export interface NearRequestSource {
    end_point: string;
    multiplier?: string;
    source_path: string;
    http_instructions?: NearHttpInstructions;
}

export type NearRequestType = "String" | { Number: string };

interface Requester {
    contract_name: string,
    account_id: string,
    stake_multiplier?: number | null,
    code_base_url?: string | null,
}

export interface ActiveNearRequest {
    id: string;
    description: string | null;
    sources: NearRequestSource[],
    outcomes: string[] | null;
    requestor?: {
        interface_name: string;
        account_id: string;
        stake_multiplier: null;
        code_base_url: string | null;
    };
    requester?: Requester;
    resolution_windows: NearRequestResolutionWindow[];
    global_config_id: string;
    initial_challenge_period: string;
    final_arbitrator_triggered: boolean;
    tags: string[];
    data_type: NearRequestType;
    provider?: string | null;
    request_config?: {
        validity_bond?: string;
        paid_fee?: string;
        stake_multiplier?: number;
        min_resolution_bond?: string;
    },
}

export interface FinalizedNearRequest {
    id: string;
    finalized_outcome: NearOutcome | null;
    resolution_windows: NearRequestResolutionWindow[];
    global_config_id: string;
    paid_fee: string;
}

export interface NearRequest {
    Active?: ActiveNearRequest;
    Finalized?: FinalizedNearRequest;
}

function convertNearSourceToDataRequestSource(sources: NearRequestSource[]): RequestInfo[] {
    return sources.map(source => {
        const resultSource: RequestInfo = {
            http_method: 'GET',
            end_point: source.end_point,
            source_path: source.source_path,
            multiplier: source.multiplier,
        };

        if (source.http_instructions) {
            const method: HttpMethod = Object.keys(source.http_instructions)[0] as HttpMethod ?? 'Get';
            
            if (source.http_instructions[method]) {
                resultSource.http_method = method.toUpperCase();
                resultSource.http_body = source.http_instructions[method].http_body;
                resultSource.http_headers = source.http_instructions[method].http_headers;
            }
        }

        return resultSource;
    });
}

export function transformToDataRequest(request: NearRequest): DataRequest {
    // TODO: We also might want to encode the token contract id in the metadata
    const { Active, Finalized } = request;
    const requestId = Active?.id.toString() ?? Finalized?.id.toString() ?? '';

    return {
        id: requestId,
        internalId: buildInternalId(requestId, PROVIDER_ID, ''),
        requiredEnvVariables: [],
        requester: Active?.requester?.account_id ?? Active?.requestor?.account_id ?? '',
        tags: Active?.tags ?? [],
        dataType: Active?.data_type === 'String' ? { type: 'string' } : { type: 'number', multiplier: Active?.data_type.Number ?? '0' },
        finalArbitratorTriggered: Active?.final_arbitrator_triggered ?? false,
        outcomes: Active?.outcomes ?? [],
        sources: convertNearSourceToDataRequestSource(Active?.sources ?? []),
        providerId: PROVIDER_ID,
        finalizedOutcome: Finalized?.finalized_outcome ? transformToOutcome(Finalized.finalized_outcome) : undefined,
        staking: [],
        config: {
            paidFee: Active?.request_config?.paid_fee ?? '0',
            validityBond: Active?.request_config?.validity_bond ?? '0',
            stakeMultiplier: Active?.request_config?.stake_multiplier,
            minResolutionBond: Active?.request_config?.min_resolution_bond ?? '1',
        },
        paidFee: Finalized?.paid_fee ?? undefined,
        resolutionWindows: Active?.resolution_windows.map(rw => ({
            round: rw.round,
            bondSize: rw.bond_size,
            startTime: new Date(nsToMs(Number(rw.start_time))),
            endTime: new Date(nsToMs(Number(rw.end_time))),
            bondedOutcome: rw.bonded_outcome ? transformToOutcome(rw.bonded_outcome) : undefined,
        })) ?? [],
        allowedValidators: request.Active?.provider ? [request.Active.provider] : [],
    };
}