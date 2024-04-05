import "@stdlib/ownable";
import "@stdlib/stoppable";
import "./types.tact";

contract TonDcaWallet with Ownable, Stoppable {

    const MIN_TON_BALANCE: Int = ton("0.15");

    owner: Address;
    parent: Address;
    index: Int as uint32;
    stopped: Bool;

    dca_amount: Int as uint32 = 0;
    dca_interval_in_seconds: Int as uint32 = 0;
    dca_next_buy_time: Int = 0;

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

    external("ProcessPay") {
        require(self.dca_next_buy_time <= now(), "Too early for buy");

        acceptMessage();

        self.dca_next_buy_time = self.dca_next_buy_time + self.dca_interval_in_seconds;

//        let cell: Cell = beginCell()
//            .storeUint(0x18, 6)
//            .storeAddress(self.owner)
//            .storeCoins(ton("0.3"))
//            .storeUint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
//            .storeUint(0x706c7567, 32)
//            .storeUint(1, 64)
//            .storeCoins(ton("10"))
//            .storeUint(0, 1)
//            .endCell();
//
//        send(SendParameters{
//            to: self.owner,
//            value: 0,
//            mode: SendIgnoreErrors,
//            body: cell
//        });
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
