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
    jetton_wallet: Address;
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

    owner: Address;
    parent: Address;
    index: Int as uint32;
    stopped: Bool;

    dca_amount: Int as uint32 = 0;
    dca_interval_in_seconds: Int as uint32 = 0;
    dca_next_buy_time: Int = 0;

    jetton_balances: map<Address, Int>;
    top_uppable_jettons: map<Address, Bool>;
    withdrawable_jettons: map<Address, Bool>;

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
        //her sender() is current contract jetton wallet
        //@todo скорее всего тут нужна проверка на валидность jetton_wallet address
        let currentBalance: Int? = self.jetton_balances.get(sender());
        if(currentBalance == null){
            self.jetton_balances.set(sender(), msg.amount);
        }else{
            self.jetton_balances.set(sender(), currentBalance!! + msg.amount);
        }

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
        let currentBalance: Int? = self.jetton_balances.get(msg.jetton_wallet);
        require(currentBalance != null, "Invalid jetton balance");
        let jettonBalanceAfterWithdraw: Int = currentBalance!! - msg.amount;
        require(jettonBalanceAfterWithdraw >= 0, "Invalid jetton balance");
        self.jetton_balances.set(msg.jetton_wallet, jettonBalanceAfterWithdraw);

        send(SendParameters{
                to: msg.jetton_wallet,
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

        acceptMessage();

        self.dca_next_buy_time = self.dca_next_buy_time + self.dca_interval_in_seconds;

        send(SendParameters{
            to: address(""),//@todo my jetton wallet of USDT
            value: 0,
            mode: SendIgnoreErrors,
            body: JettonTransfer {
                query_id: 0, //@todo random uin64
                amount: self.dca_amount,
                destination: Address,//@todo
                response_destination: Address,//@todo
                custom_payload: null,
                forward_ton_amount: ton("0.265"),
                forward_payload: JettonTransferForwardPayload {
                    is_right: true,
                    value: StonfiSwapForwardPayload {
                        sum_type: "StonfiSwap",
                        op_code: 0x25938561,
                        value: StonfiSwapForwardPayloadValue {
                            token_wallet: Address, //@todo The address of the router's wallet of second Jetton
                            min_out: 1,
                            to_address: Address, //@todo user address
                            referral_address: null
                        }
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
            next_buy_time: self.dca_next_buy_time
        };
    }

    get fun get_jetton_balances(): map<Address, Int> {
        return self.jetton_balances;
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
