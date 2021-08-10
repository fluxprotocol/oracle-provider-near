import { Token } from "./Token";

export interface OracleConfigApiResponse {
    stake_token: string;
    bond_token: string;
}

export interface OracleConfig {
    stakeToken: Token;
}