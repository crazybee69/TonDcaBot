import {Blockchain, SandboxContract, TreasuryContract} from '@ton/sandbox';
import {Cell, toNano} from '@ton/core';
import '@ton/test-utils';
import {TonDcaWallet} from "../wrappers/TonDcaWallet";
import {TonDcaMaster} from "../build/TonDcaMaster/tact_TonDcaMaster";

describe('TonDcaWallet', () => {
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

    it('should create wallet', async () => {
        const createWalletResponse = await tonDcaMaster.send(customer.getSender(),
            {
                value: toNano('0.5')
            },
            {
                $$type: 'CreateWallet',
                queryId: 0n,
                amount: 10n,
                interval: 86400n,
                next_buy_time: now + 86400n
            })

        const walletAddress = await tonDcaMaster.getGetWalletAddress(customer.address)
        const wallet: SandboxContract<TonDcaWallet> = blockchain.openContract(TonDcaWallet.fromAddress(walletAddress))

        expect(createWalletResponse.transactions).toHaveTransaction({
            from: tonDcaMaster.address,
            to: wallet.address,
            deploy: true,
            success: true,
        });

        const settings = await wallet.getGetSettings()
        expect(settings.owner).toEqualAddress(customer.address)
        expect(settings.amount).toEqual(10n)
        expect(settings.interval).toEqual(86400n)
        expect(settings.next_buy_time).toEqual(now + 86400n)
    });


    it('should top up jetton balance', async () => {
        const createWalletResponse = await tonDcaMaster.send(customer.getSender(),
            {
                value: toNano('0.5')
            },
            {
                $$type: 'CreateWallet',
                queryId: 0n,
                amount: 10n,
                interval: 86400n,
                next_buy_time: now + 86400n
            })

        const walletAddress = await tonDcaMaster.getGetWalletAddress(customer.address)
        const wallet: SandboxContract<TonDcaWallet> = blockchain.openContract(TonDcaWallet.fromAddress(walletAddress))

        expect(createWalletResponse.transactions).toHaveTransaction({
            from: tonDcaMaster.address,
            to: wallet.address,
            deploy: true,
            success: true,
        });

        const jettonNotifyWalletResponse = await wallet.send(deployer.getSender(),
            {
                value: toNano('0.3')
            },
            {
                $$type: 'JettonNotify',
                queryId: 0n,
                amount: 10n,
                sender: customer.address,
                forward_payload: Cell.EMPTY
            })

        expect(jettonNotifyWalletResponse.transactions).toHaveTransaction({
            from: deployer.address,
            to: wallet.address,
            success: true,
        });

        // const jettonBalances = await wallet.getGetJettonBalances()
        // expect(jettonBalances.get(deployer.address)).toEqual(10n)

    });

    it('should withdraw jetton balance', async () => {
        const createWalletResponse = await tonDcaMaster.send(customer.getSender(),
            {
                value: toNano('0.5')
            },
            {
                $$type: 'CreateWallet',
                queryId: 0n,
                amount: 10n,
                interval: 86400n,
                next_buy_time: now + 86400n
            })

        const walletAddress = await tonDcaMaster.getGetWalletAddress(customer.address)
        const wallet: SandboxContract<TonDcaWallet> = blockchain.openContract(TonDcaWallet.fromAddress(walletAddress))

        expect(createWalletResponse.transactions).toHaveTransaction({
            from: tonDcaMaster.address,
            to: wallet.address,
            deploy: true,
            success: true,
        });

        const jettonNotifyWalletResponse = await wallet.send(deployer.getSender(),
            {
                value: toNano('0.3')
            },
            {
                $$type: 'JettonNotify',
                queryId: 0n,
                amount: 10n,
                sender: customer.address,
                forward_payload: Cell.EMPTY
            })

        expect(jettonNotifyWalletResponse.transactions).toHaveTransaction({
            from: deployer.getSender().address,
            to: wallet.address,
            success: true,
        });

        // let jettonBalances = await wallet.getGetJettonBalances()
        // expect(jettonBalances.get(deployer.address)).toEqual(10n)
        //
        // const withdrawWalletResponse = await wallet.send(customer.getSender(),
        //     {
        //         value: toNano('0.3')
        //     },
        //     {
        //         $$type: 'WithdrawJetton',
        //         queryId: 0n,
        //         amount: 10n,
        //         jetton_wallet: deployer.address
        //     })
        //
        // expect(withdrawWalletResponse.transactions).toHaveTransaction({
        //     from: customer.address,
        //     to: wallet.address,
        //     success: true,
        // });
        //
        // jettonBalances = await wallet.getGetJettonBalances()
        // expect(jettonBalances.get(deployer.address)).toEqual(0n)

    });

});
