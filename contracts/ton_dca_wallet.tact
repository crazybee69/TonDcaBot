import "@stdlib/ownable";
import "@stdlib/stoppable";
import "./types.tact";

message InitUsdtJettonAddress {
    queryId: Int as uint64;
    usdt_jetton_address: Address;
}

struct JettonTransferForwardPayload {
    is_right: Bool;
    value: Slice as remaining;
}

message(0x0f8a7ea5) JettonTransfer {
    query_id: Int as uint64;
    amount: Int as coins;
    destination: Address;
    response_destination: Address;
    custom_payload: Cell?;
    forward_ton_amount: Int as coins;
    forward_payload: JettonTransferForwardPayload;
}

message(0x7362d09c) JettonNotify {
    queryId: Int as uint64;
    amount: Int as coins;
    sender: Address;
    forward_payload: Slice as remaining;
}

message(0xd53276db) TokenExcesses {
    queryId: Int as uint64;
}

message WithdrawJetton {
    queryId: Int as uint64;
    amount: Int as coins;
}

struct StonfiSwapForwardPayloadValue {
    token_wallet: Address;
    min_out: Int as coins;
    to_address: Address;
    referral_address: Address?;
}

struct StonfiSwapForwardPayload {
    sum_type: String;
    op_code: Int as uint32;
    value: StonfiSwapForwardPayloadValue;
}

const JETTON_TRANSFER_OP_CODE: Int = 0x0f8a7ea5;
const STONFI_SWAP_OK_REF_OP_CODE: Int = 0x2283c2a0;
const STONFI_SWAP_OP_CODE: Int = 0x25938561;
const STONFI_SWAP_FORWARD_TON_AMOUNT: Int = ton("0.265");

contract TonDcaWallet with Ownable, Stoppable {

    const MIN_TON_BALANCE: Int = ton("0.05");
    const STONFI_ROUTER_ADDRESS: Address = address("kQBsGx9ArADUrREB34W-ghgsCgBShvfUr4Jvlu-0KGc33a1n");
    const STONFI_PROXY_TON_WALLET: Address = address("kQCdC2b1GG1saybYxCwRfEqr4WlOexsQIcYcfMYObk_477vs"); // ProxyTON Wallet

    owner: Address;
    master: Address;
    stopped: Bool;

    dca_amount: Int as uint32 = 0;
    dca_interval_in_seconds: Int as uint32 = 0;
    dca_next_buy_time: Int = 0;

    usdt_jetton_address: Address?;
    usdt_jetton_balance: Int as coins = 0;

    init(master: Address, owner: Address) {
        self.master = master;
        self.owner = owner;
        self.stopped = false;
    }

    receive(msg: InternalInitWalletSettings) {
        self.requireMaster();
        self.validateAmount(msg.amount);
        self.validateInterval(msg.interval);

        self.owner = msg.owner;
        self.dca_amount = msg.amount;
        self.dca_interval_in_seconds = msg.interval;
        self.dca_next_buy_time = msg.next_buy_time;

        let msgValue: Int = context().value;
        let tonBalanceBeforeMsg: Int = myBalance() - msgValue;
        let storageFee: Int = self.MIN_TON_BALANCE + min(tonBalanceBeforeMsg, self.MIN_TON_BALANCE);
        msgValue = msgValue - storageFee;

        send(SendParameters{
            to: self.owner,
            value: msgValue,
            mode: SendIgnoreErrors,
            body: "DCA Strategy created".asComment()
        });
    }

    receive(msg: InitUsdtJettonAddress) {
        self.requireOwner();
        self.usdt_jetton_address = msg.usdt_jetton_address;
    }

    receive(msg: UpdateWalletSettings) {
        self.requireOwner();
        self.validateAmount(msg.amount);
        self.validateInterval(msg.interval);

        self.dca_amount = msg.amount;
        self.dca_interval_in_seconds = msg.interval;
        self.dca_next_buy_time = msg.next_buy_time;

        self.reply("Settings updated".asComment());
    }

    receive("Resume") {
        self.requireOwner();
        self.requireStopped();
        self.stopped = false;
        self.dca_next_buy_time = now() + self.dca_interval_in_seconds;
        self.reply("Resumed".asComment());
    }

    receive(msg: JettonNotify) {
        if(sender() == self.STONFI_PROXY_TON_WALLET && msg.sender == self.STONFI_ROUTER_ADDRESS){
            let swapOpCode: Int = msg.forward_payload.loadUint(32);
            if(swapOpCode == STONFI_SWAP_OK_REF_OP_CODE) {
                self.dca_next_buy_time = self.dca_next_buy_time + self.dca_interval_in_seconds;
            }
            return;
        }

        if(self.usdt_jetton_address == null) {
            return;
        }

        if(sender() == self.usdt_jetton_address!! && msg.sender == self.owner) {
            self.usdt_jetton_balance = self.usdt_jetton_balance + msg.amount;

            send(SendParameters{
                to: self.owner,
                value: 0,
                bounce: false,
                mode: SendRemainingValue | SendIgnoreErrors,
                body: "Jetton balance has been topped up".asComment()
            });
        }
    }

    receive(msg: WithdrawJetton) {
        self.requireOwner();
        let jettonBalanceAfterWithdraw: Int = self.usdt_jetton_balance - msg.amount;
        require(jettonBalanceAfterWithdraw >= 0, "Invalid requested amount");
        self.usdt_jetton_balance = jettonBalanceAfterWithdraw;

        send(SendParameters{
                to: self.usdt_jetton_address!!,
                value: ton("0.1"),
                mode: SendIgnoreErrors,
                body: JettonTransfer {
                    query_id: msg.queryId,
                    amount: msg.amount,
                    destination: sender(),
                    response_destination: myAddress(),
                    custom_payload: null,
                    forward_ton_amount: 1,
                    forward_payload: JettonTransferForwardPayload{
                        is_right: false,
                        value: emptySlice()
                    }
                }.toCell()
        });
    }

    receive(msg: TokenExcesses) {
        //для получения кэшбека после withdraw
    }

    external("ProcessPay") {
        self.requireNotStopped();
        require(self.dca_next_buy_time <= now(), "Too early for buy");
        require(self.usdt_jetton_balance >= self.dca_amount, "Insufficient funds for DCA buy");
        acceptMessage();

        self.requestStonfiSwap(self.dca_amount);
    }

    get fun get_settings(): WalletSettings {
        return WalletSettings{
            owner: self.owner,
            amount: self.dca_amount,
            interval: self.dca_interval_in_seconds,
            stopped: self.stopped,
            next_buy_time: self.dca_next_buy_time,
            usdt_balance: self.usdt_jetton_balance,
            usdt_jetton_address: self.usdt_jetton_address
        };
    }

    fun requestStonfiSwap(amount: Int) {
        let swapPayload: Cell = beginCell()
            .storeUint(STONFI_SWAP_OP_CODE, 32)
            .storeAddress(self.STONFI_PROXY_TON_WALLET)
            .storeCoins(1)
            .storeAddress(self.owner)
            .storeUint(1, 1)//.storeUint(0, 1) - referral_address: null
            .storeAddress(myAddress())
            .endCell();

        let body: Cell = beginCell()
            .storeUint(JETTON_TRANSFER_OP_CODE, 32)//op_code
            .storeUint(999, 64)//query_id
            .storeCoins(amount)//jetton_amount
            .storeAddress(self.STONFI_ROUTER_ADDRESS)//send_to
            .storeAddress(self.owner)//excess_to //.storeUint(0, 2)//пустой адрес - excess_to
            .storeUint(0, 1)//custom_payload: null
            .storeCoins(STONFI_SWAP_FORWARD_TON_AMOUNT)//forward_ton_amount
            .storeUint(1, 1)//has_forward_payload: true
            .storeRef(swapPayload)//forward_payload
            .endCell();

         send(SendParameters{
            to: self.usdt_jetton_address!!,
            value: ton("0.05"),
            mode: SendIgnoreErrors,
            body: body
        });
    }

    fun requireMaster() {
        require(sender() == self.master, "Master Only");
    }

    fun validateAmount(amount: Int) {
        require(amount > 1, "Amount can't be less than 1");
    }

    fun validateInterval(interval: Int) {
        require(interval > 43200, "Interval can't be less than 12 hours");
    }
}
