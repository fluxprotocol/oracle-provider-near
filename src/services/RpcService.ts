import { Account } from "near-api-js";
import DataRequest from "@fluxprotocol/oracle-provider-core/dist/DataRequest";
import { Config } from "../models/Config";
import { OracleConfig, OracleConfigApiResponse } from "../models/OracleConfig";
import { NearRequest, transformToDataRequest } from "../models/NearDataRequest";
import { ILogger } from "@fluxprotocol/oracle-provider-core/dist/Core";

class RpcService {
    constructor(public config: Config, private account: Account, private logger: ILogger) {}

    public async getTokenBalance(tokenId: string, accountId: string): Promise<string> {
        const balance: string = await this.account.viewFunction(tokenId, 'ft_balance_of', {
            account_id: accountId,
        });

        return balance;
    }

    public async getOracleConfig(): Promise<OracleConfig> {
        const config: OracleConfigApiResponse = await this.account.viewFunction(this.config.oracleContractId, 'get_config', {});
        const tokenMetadata = await this.account.viewFunction(config.stake_token, 'ft_metadata', {});

        return {
            stakeToken: {
                contractId: config.stake_token,
                decimals: tokenMetadata.decimals,
                symbol: tokenMetadata.symbol,
            },
        }
    }

    public async getRequestById(id: string): Promise<DataRequest | undefined> {
        try {
            const request = await this.account.viewFunction(this.config.oracleContractId, 'get_request_by_id', {
                id,
            });
        
            return transformToDataRequest(request);
        } catch (error) {
            this.logger.error(`${id} - ${error}`);
            return undefined;
        }
    }

    public async getRequests(startingId: string, limit: string = "15"): Promise<DataRequest[]> {
        try {
            const requests: NearRequest[] = await this.account.viewFunction(this.config.oracleContractId, 'get_requests', {
                from_index: startingId,
                limit: limit,
            });
    
            return requests.map(request => transformToDataRequest(request));
        } catch (error) {
            this.logger.error(`[near] getRequests - ${error}`);
            return [];
        }
    }
}


export default RpcService;
