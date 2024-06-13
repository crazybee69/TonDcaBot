import {Address, beginCell, Cell, Contract, ContractProvider, Sender, toNano,} from "ton-core";
import {fromNano} from "ton";

export default class TonDcaWallet implements Contract {

    async getWalletSettings(provider: ContractProvider) {
        const {stack} = await provider.get("get_settings", []);

        return {
            owner: stack.readAddress().toString(),
            master: stack.readAddress().toString(),
            amount: fromNano(stack.readBigNumber().toString()),
            interval: Number(stack.readBigNumber().toString()),
            stopped: stack.readBoolean(),
            next_buy_time: Number(stack.readBigNumber().toString()),
            usdt_balance: fromNano(stack.readBigNumber().toString()),
            usdt_jetton_address: stack.readAddressOpt()?.toString(),
            buys_count: Number(stack.readBigNumber().toString()),
            avg_buy_price: fromNano(stack.readBigNumber().toString()),
        }
    }

    async sendUpdateWalletSettings(provider: ContractProvider, via: Sender, queryId: number, amount: bigint, interval: number, nextBuyTime: number) {
        const messageBody = beginCell()
            .storeUint(3031042156, 32)
            .storeUint(queryId, 64)
            .storeUint(amount, 32)
            .storeUint(interval, 32)
            .storeInt(nextBuyTime, 257)
            .endCell()

        await provider.internal(via, {
            value: toNano("0.01"),
            body: messageBody,
        });
    }

    async sendInitUsdtJettonWallet(provider: ContractProvider, via: Sender, queryId: number, usdtJettonWalletAddress: Address) {
        const messageBody = beginCell()
            .storeUint(369428537, 32)
            .storeUint(queryId, 64)
            .storeAddress(usdtJettonWalletAddress)
            .endCell();

        await provider.internal(via, {
            value: toNano("0.01"),
            body: messageBody,
        });
    }

    async sendWithdrawUsdtJetton(provider: ContractProvider, via: Sender, queryId: number, amount: bigint) {
        const messageBody = beginCell()
            .storeUint(3688209801, 32)
            .storeUint(queryId, 64)
            .storeCoins(amount)
            .endCell();

        await provider.internal(via, {
            value: toNano('0.2'),
            body: messageBody,
        });
    }

    async sendWithdrawTON(provider: ContractProvider, via: Sender, queryId: number) {
        const messageBody = beginCell()
            .storeUint(4186866099, 32)
            .storeUint(queryId, 64)
            .endCell();

        await provider.internal(via, {
            value: toNano('0.1'),
            body: messageBody,
        });
    }

    async sendStop(provider: ContractProvider, via: Sender) {
        const messageBody = beginCell().storeUint(0, 32).storeStringTail('Stop').endCell();

        await provider.internal(via, {
            value: toNano("0.01"),
            body: messageBody,
        });
    }

    async sendResume(provider: ContractProvider, via: Sender) {
        const messageBody = beginCell().storeUint(0, 32).storeStringTail('Resume').endCell();

        await provider.internal(via, {
            value: toNano("0.01"),
            body: messageBody,
        });
    }

    async sendProcessPay(provider: ContractProvider) {
        const messageBody = beginCell().storeUint(0, 32).storeStringTail('ProcessPay').endCell();

        await provider.external(messageBody);
    }

    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) {
    }
}
