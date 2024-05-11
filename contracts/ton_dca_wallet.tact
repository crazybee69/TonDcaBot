import "@stdlib/ownable";
import "@stdlib/stoppable";
import "./types.tact";

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

contract TonDcaWallet with Ownable, Stoppable {

    const MIN_TON_BALANCE: Int = ton("0.15");
    const STONFI_ROUTER_ADDRESS: Address = address("kQBsGx9ArADUrREB34W-ghgsCgBShvfUr4Jvlu-0KGc33a1n");
    const STONFI_PROXY_TON_WALLET: Address = address("kQCdC2b1GG1saybYxCwRfEqr4WlOexsQIcYcfMYObk_477vs"); // ProxyTON Wallet

    owner: Address;
    parent: Address;
    index: Int as uint32;
    stopped: Bool;

    dca_amount: Int as uint32 = 0;
    dca_interval_in_seconds: Int as uint32 = 0;
    dca_next_buy_time: Int = 0;

    usdt_jetton_address: Address?;
    usdt_jetton_balance: Int as coins = 0;

    init(parent: Address, index: Int) {
        self.parent = parent;
        self.owner = sender();
        self.index = index;
        self.stopped = false;
    }

    receive(msg: InternalInitWalletSettings) {
        self.requireParent();
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
        nativeThrowUnless(132, msg.sender == self.owner);

        if(self.usdt_jetton_address == null) {
            self.usdt_jetton_address = sender();
        } else{
            if(sender() != self.usdt_jetton_address!!){
                //DCA Wallet получил какие-то токены на баланс (не USDT)
                //@todo послать запрос своему jetton, чтобы переслал это владельцу
                dump("Mega drive");
            }
        }

        self.usdt_jetton_balance = self.usdt_jetton_balance + msg.amount;

        send(SendParameters{
            to: self.owner,
            value: 0,
            bounce: false,
            mode: SendRemainingValue | SendIgnoreErrors,
            body: "Jetton balance has been topped up".asComment()
        });
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
                    forward_ton_amount: 0,
                    forward_payload: JettonTransferForwardPayload{
                        is_right: false,
                        value: emptySlice()
                    }
                }.toCell()
            });

        self.reply("Withdraw requested".asComment());
    }

    receive(msg: TokenExcesses) {
        //@todo сюда будут приходить копейки TON после swap
        //@todo записать успех, а если пришел bounced<JettonTransfer> - вернуть на место баланс

//        send(SendParameters{
//            to: self.owner,
//            value: 0,
//            bounce: false,
//            mode: SendRemainingValue | SendIgnoreErrors,
//            body: "TokenExcesses processed successfully".asComment()
//        });
    }

//    bounced(src: bounced<JettonTransfer>) {
//
//    }

    external("ProcessPay") {
        self.requireNotStopped();
        require(self.dca_next_buy_time <= now(), "Too early for buy");
        require(self.usdt_jetton_balance >= self.dca_amount, "Insufficient funds for DCA buy");
        acceptMessage();

        self.dca_next_buy_time = self.dca_next_buy_time + self.dca_interval_in_seconds;

        send(SendParameters{
            to: self.usdt_jetton_address!!,
            value: 0,
            mode: SendIgnoreErrors,
            body: JettonTransfer {
                query_id: 0, //@todo random uin64
                amount: self.dca_amount,
                destination: self.STONFI_ROUTER_ADDRESS,
                response_destination: myAddress(),
                custom_payload: null,
                forward_ton_amount: ton("0.265"),
                forward_payload: JettonTransferForwardPayload {
                    is_right: true,
                    value: StonfiSwapForwardPayload {
                        sum_type: "StonfiSwap",
                        op_code: 0x25938561,
                        value: StonfiSwapForwardPayloadValue {
                            token_wallet: self.STONFI_PROXY_TON_WALLET,
                            min_out: 1,
                            to_address: self.owner,
                            referral_address: null
                        }.toCell().asSlice()//@todo тут
                    }
                }
            }.toCell()
        });
    }

    get fun get_settings(): WalletSettings {
        return WalletSettings{
            owner: self.owner,
            amount: self.dca_amount,
            interval: self.dca_interval_in_seconds,
            stopped: self.stopped,
            next_buy_time: self.dca_next_buy_time,
            usdt_balance: self.usdt_jetton_balance
        };
    }

    fun requireParent() {
        require(sender() == self.parent, "Parent Only");
    }

    fun validateAmount(amount: Int) {
        require(amount > 1, "Amount can't be less than 1");
    }

    fun validateInterval(interval: Int) {
        require(interval > 43200, "Interval can't be less than 12 hours");
    }
}
