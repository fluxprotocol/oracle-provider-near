import createNearProvider from '../test/utils/testProvider';
import createDummyDataRequest from '../test/utils/dataRequest';
import { toToken } from '@fluxprotocol/oracle-provider-core/dist/Token';
import { OutcomeType } from '@fluxprotocol/oracle-provider-core/dist/Outcome';
import * as AccountService from './services/AccountService';
import * as StorageService from './services/StorageService';
import BN from 'bn.js';

describe("NearProvider", () => {
    let getAccount: jest.SpyInstance<Promise<any>>;
    let upgradeStorage: jest.SpyInstance<Promise<void>>;

    beforeEach(() => {
        getAccount = jest.spyOn(AccountService, 'getAccount');
        upgradeStorage = jest.spyOn(StorageService, 'upgradeStorage');
    });

    afterEach(() => {
        getAccount.mockRestore();
        upgradeStorage.mockRestore();
    });

    describe("stake", () => {
        it("should stake when there is no windows", async () => {
            const functionCall = jest.fn(() => {
                return {
                    receipts_outcome: [],
                };
            });

            const request = createDummyDataRequest({
                resolutionWindows: [],
                config: {
                    paidFee: '0',
                    validityBond: toToken('1', 18),
                },
            });

            const provider = createNearProvider({
                // Normally this would be converted by init()
                'NEAR_MAX_STAKE_AMOUNT': toToken('16', 18),
                'NEAR_CONTRACT_ID': 'test'
            });

            provider.balance.deposit(toToken('16', 18));

            upgradeStorage.mockResolvedValue();
            getAccount.mockResolvedValue({
                functionCall,
            });

            await provider.stake(request, { type: OutcomeType.Invalid });

            expect(functionCall).toHaveBeenCalledWith('', 'ft_transfer_call', {
                receiver_id: 'test',
                amount: toToken('2', 18),
                msg: JSON.stringify({
                    'StakeDataRequest': {
                        id: request.id,
                        outcome: 'Invalid',
                    },
                }),
            }, provider.config.maxGas, new BN('1'));
        });

        it("should stake the bond size if there is a window size", async () => {
            const functionCall = jest.fn(() => {
                return {
                    receipts_outcome: [],
                };
            });

            const request = createDummyDataRequest({
                resolutionWindows: [
                    {
                        bondSize: toToken('2', 18),
                        endTime: new Date(1),
                        round: 0,
                        bondedOutcome: { type: OutcomeType.Answer, answer: '1' },
                    },
                    {
                        bondSize: toToken('4', 18),
                        endTime: new Date(),
                        round: 1,
                    }
                ],
            });

            const provider = createNearProvider({
                // Normally this would be converted by init()
                'NEAR_MAX_STAKE_AMOUNT': toToken('16', 18),
                'NEAR_CONTRACT_ID': 'test'
            });

            provider.balance.deposit(toToken('16', 18));

            upgradeStorage.mockResolvedValue();
            getAccount.mockResolvedValue({
                functionCall,
            });

            await provider.stake(request, { type: OutcomeType.Invalid });

            expect(functionCall).toHaveBeenCalledWith('', 'ft_transfer_call', {
                receiver_id: 'test',
                amount: toToken('4', 18),
                msg: JSON.stringify({
                    'StakeDataRequest': {
                        id: request.id,
                        outcome: 'Invalid',
                    },
                }),
            }, provider.config.maxGas, new BN('1'));
        });
    });
});