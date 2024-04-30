import {Blockchain, EmulationError, SandboxContract, TreasuryContract} from '@ton/sandbox';
import {toNano} from '@ton/core';
import {TonDcaMaster} from '../wrappers/TonDcaMaster';
import '@ton/test-utils';
import {TonDcaWallet} from "../wrappers/TonDcaWallet";

describe('TonDcaMaster', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let customer: SandboxContract<TreasuryContract>;
    let tonDcaMaster: SandboxContract<TonDcaMaster>;
    const now = BigInt(Math.floor(new Date().getTime() / 1000))

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        tonDcaMaster = blockchain.openContract(await TonDcaMaster.fromInit());

        deployer = await blockchain.treasury('deployer');
        customer = await blockchain.treasury('customer');

        const deployResult = await tonDcaMaster.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: tonDcaMaster.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and tonDcaMaster are ready to use
    });

    // it('should create wallet', async () => {
    //     const createWalletResponse = await tonDcaMaster.send(customer.getSender(),
    //         {
    //             value: toNano('0.3')
    //         },
    //         {
    //             $$type: 'CreateWallet',
    //             queryId: 0n,
    //             amount: 10n,
    //             interval: 86400n,
    //             next_buy_time: now + 86400n
    //         })
    //
    //     const walletAddress = await tonDcaMaster.getGetWalletAddress(0n)
    //     const wallet: SandboxContract<TonDcaWallet> = blockchain.openContract(TonDcaWallet.fromAddress(walletAddress))
    //
    //     expect(createWalletResponse.transactions).toHaveTransaction({
    //         from: tonDcaMaster.address,
    //         to: wallet.address,
    //         deploy: true,
    //         success: true,
    //     });
    //
    //     const index = await tonDcaMaster.getGetIndex()
    //     expect(index).toEqual(1n)
    //
    //     const settings = await wallet.getGetSettings()
    //     expect(settings.owner).toEqualAddress(customer.address)
    //     expect(settings.amount).toEqual(10n)
    //     expect(settings.interval).toEqual(86400n)
    //     expect(settings.next_buy_time).toEqual(now + 86400n)
    // });
    //
    //
    // it('can\'t create wallet with invalid amount ', async () => {
    //     const createWalletResponse = await tonDcaMaster.send(customer.getSender(),
    //         {
    //             value: toNano('0.3')
    //         },
    //         {
    //             $$type: 'CreateWallet',
    //             queryId: 0n,
    //             amount: 0n,
    //             interval: 86400n,
    //             next_buy_time: now + 86400n
    //         })
    //
    //     const walletAddress = await tonDcaMaster.getGetWalletAddress(0n)
    //
    //     expect(createWalletResponse.transactions).toHaveTransaction({
    //         from: tonDcaMaster.address,
    //         to: walletAddress,
    //         deploy: true,
    //         success: false,
    //     });
    //
    //     const index = await tonDcaMaster.getGetIndex()
    //     expect(index).toEqual(0n)
    // });
    //
    //
    // it('can\'t create wallet with invalid interval ', async () => {
    //     const createWalletResponse = await tonDcaMaster.send(customer.getSender(),
    //         {
    //             value: toNano('0.3')
    //         },
    //         {
    //             $$type: 'CreateWallet',
    //             queryId: 0n,
    //             amount: 10n,
    //             interval: 200n,
    //             next_buy_time: now + 86400n
    //         })
    //
    //     const walletAddress = await tonDcaMaster.getGetWalletAddress(0n)
    //
    //     expect(createWalletResponse.transactions).toHaveTransaction({
    //         from: tonDcaMaster.address,
    //         to: walletAddress,
    //         deploy: true,
    //         success: false,
    //     });
    //
    //     const index = await tonDcaMaster.getGetIndex()
    //     expect(index).toEqual(0n)
    // });
    //
    // it('should update wallet settings', async () => {
    //     await tonDcaMaster.send(customer.getSender(),
    //         {
    //             value: toNano('0.3')
    //         },
    //         {
    //             $$type: 'CreateWallet',
    //             queryId: 0n,
    //             amount: 10n,
    //             interval: 86400n,
    //             next_buy_time: now + 86400n
    //         })
    //
    //     const walletAddress = await tonDcaMaster.getGetWalletAddress(0n)
    //     const wallet: SandboxContract<TonDcaWallet> = blockchain.openContract(TonDcaWallet.fromAddress(walletAddress))
    //
    //     await wallet.send(customer.getSender(),
    //         {
    //             value: toNano('0.3')
    //         },
    //         {
    //             $$type: 'UpdateWalletSettings',
    //             queryId: 0n,
    //             amount: 50n,
    //             interval: 86400n * 2n,
    //             next_buy_time: now + 3600n
    //         })
    //
    //     const settings = await wallet.getGetSettings()
    //
    //     expect(settings.owner).toEqualAddress(customer.address)
    //     expect(settings.amount).toEqual(50n)
    //     expect(settings.interval).toEqual(86400n * 2n)
    //     expect(settings.next_buy_time).toEqual(now + 3600n)
    // });
    //
    // it('should pause and resume wallet', async () => {
    //     await tonDcaMaster.send(customer.getSender(),
    //         {
    //             value: toNano('0.3')
    //         },
    //         {
    //             $$type: 'CreateWallet',
    //             queryId: 0n,
    //             amount: 10n,
    //             interval: 86400n,
    //             next_buy_time: now + 86400n
    //         })
    //
    //     const walletAddress = await tonDcaMaster.getGetWalletAddress(0n)
    //     const wallet: SandboxContract<TonDcaWallet> = blockchain.openContract(TonDcaWallet.fromAddress(walletAddress))
    //
    //     await wallet.send(customer.getSender(), {value: toNano('0.3')}, "Stop")
    //     let settings = await wallet.getGetSettings()
    //     expect(settings.stopped).toEqual(true)
    //
    //     await wallet.send(customer.getSender(), {value: toNano('0.3')}, "Resume")
    //     settings = await wallet.getGetSettings()
    //     expect(settings.stopped).toEqual(false)
    // });
    //
    // it('should update only by owner', async () => {
    //     await tonDcaMaster.send(customer.getSender(),
    //         {
    //             value: toNano('0.3')
    //         },
    //         {
    //             $$type: 'CreateWallet',
    //             queryId: 0n,
    //             amount: 10n,
    //             interval: 86400n,
    //             next_buy_time: now + 86400n
    //         })
    //
    //     const walletAddress = await tonDcaMaster.getGetWalletAddress(0n)
    //     const wallet: SandboxContract<TonDcaWallet> = blockchain.openContract(TonDcaWallet.fromAddress(walletAddress))
    //
    //     await wallet.send(deployer.getSender(), {value: toNano('0.3')}, "Stop")
    //     let settings = await wallet.getGetSettings()
    //     expect(settings.stopped).toEqual(false)
    // });
    //
    // it('can\'t update with invalid interval or amount', async () => {
    //     await tonDcaMaster.send(customer.getSender(),
    //         {
    //             value: toNano('0.3')
    //         },
    //         {
    //             $$type: 'CreateWallet',
    //             queryId: 0n,
    //             amount: 10n,
    //             interval: 86400n,
    //             next_buy_time: now + 86400n
    //         })
    //
    //     const walletAddress = await tonDcaMaster.getGetWalletAddress(0n)
    //     const wallet: SandboxContract<TonDcaWallet> = blockchain.openContract(TonDcaWallet.fromAddress(walletAddress))
    //
    //     await wallet.send(customer.getSender(),
    //         {
    //             value: toNano('0.3')
    //         },
    //         {
    //             $$type: 'UpdateWalletSettings',
    //             queryId: 0n,
    //             amount: 0n,
    //             interval: 86400n,
    //             next_buy_time: now + 86400n
    //         })
    //
    //     let settings = await wallet.getGetSettings()
    //
    //     expect(settings.owner).toEqualAddress(customer.address)
    //     expect(settings.amount).toEqual(10n)
    //     expect(settings.interval).toEqual(86400n)
    //     expect(settings.next_buy_time).toEqual(now + 86400n)
    //
    //     await wallet.send(customer.getSender(),
    //         {
    //             value: toNano('0.3')
    //         },
    //         {
    //             $$type: 'UpdateWalletSettings',
    //             queryId: 0n,
    //             amount: 5n,
    //             interval: 1800n,
    //             next_buy_time: now + 86400n
    //         })
    //
    //     settings = await wallet.getGetSettings()
    //
    //     expect(settings.owner).toEqualAddress(customer.address)
    //     expect(settings.amount).toEqual(10n)
    //     expect(settings.interval).toEqual(86400n)
    //     expect(settings.next_buy_time).toEqual(now + 86400n)
    // });
    //
    //
    // it('not ready for process pay', async () => {
    //     const createWalletResponse = await tonDcaMaster.send(customer.getSender(),
    //         {
    //             value: toNano('0.3')
    //         },
    //         {
    //             $$type: 'CreateWallet',
    //             queryId: 0n,
    //             amount: 10n,
    //             interval: 86400n,
    //             next_buy_time: now + 86400n,
    //         })
    //
    //     const walletAddress = await tonDcaMaster.getGetWalletAddress(0n)
    //
    //     expect(createWalletResponse.transactions).toHaveTransaction({
    //         from: tonDcaMaster.address,
    //         to: walletAddress,
    //         deploy: true,
    //         success: true,
    //     });
    //
    //     const wallet: SandboxContract<TonDcaWallet> = blockchain.openContract(TonDcaWallet.fromAddress(walletAddress))
    //
    //     const beforeSettings = await wallet.getGetSettings()
    //
    //     expect(() => wallet.sendExternal("ProcessPay")).rejects.toThrowError(EmulationError)
    //
    //     const afterSettings = await wallet.getGetSettings()
    //
    //     expect(beforeSettings.next_buy_time).toEqual(afterSettings.next_buy_time)
    // });
    //
    //
    // it('swap', async () => {
    //     const createWalletResponse = await tonDcaMaster.send(customer.getSender(),
    //         {
    //             value: toNano('0.3')
    //         },
    //         {
    //             $$type: 'CreateWallet',
    //             queryId: 0n,
    //             amount: 10n,
    //             interval: 86400n,
    //             next_buy_time: now + 86400n,
    //         })
    //
    //     const walletAddress = await tonDcaMaster.getGetWalletAddress(0n)
    //
    //     console.log(createWalletResponse.transactions)
    //
    //     expect(createWalletResponse.transactions).toHaveTransaction({
    //         from: tonDcaMaster.address,
    //         to: walletAddress,
    //         deploy: true,
    //         success: true,
    //     });
    //
    //     // const wallet: SandboxContract<TonDcaWallet> = blockchain.openContract(TonDcaWallet.fromAddress(walletAddress))
    //
    //     // const response = await wallet.send(customer.getSender(), {value: toNano('0.3')}, "Swap")
    //
    //     // console.log(response.transactions)
    //
    // });
});
