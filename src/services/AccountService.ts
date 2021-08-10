import { Account, Near } from "near-api-js";
import cache from "../utils/cache";

/**
 * Gets and caches an account
 *
 * @export
 * @param {Near} near
 * @param {string} accountId
 * @return {Promise<Account>}
 */
export function getAccount(near: Near, accountId: string): Promise<Account> {
    return cache(`near_account_${accountId}`, async () => {
        return near.account(accountId);
    });
}