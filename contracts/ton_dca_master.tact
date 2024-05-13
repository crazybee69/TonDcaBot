import "@stdlib/deploy";
import "@stdlib/ownable";
import "./ton_dca_wallet.tact";
import "./types.tact";

message CreateWallet {
    queryId: Int as uint64;
    amount: Int as uint32;
    interval: Int as uint32;
    next_buy_time: Int;
}

message ClaimFees {
    queryId: Int as uint64;
}

message UpdateCreateWalletFee {
    queryId: Int as uint64;
    fee: Int as coins;
}

contract TonDcaMaster with Deployable, Ownable {

    owner: Address;
    minTonForStorage: Int as coins = ton("0.03");
    createWalletFee: Int as coins = ton("0.15");

    init() {
        self.owner = sender();
    }

    receive(msg: CreateWallet) {
        let newWallet: StateInit = self.getWalletStateInit(sender());
        let msgValue: Int = context().value;
        let tonBalanceBeforeMsg: Int = myBalance() - msgValue;
        let storageFee: Int = self.minTonForStorage + min(tonBalanceBeforeMsg, self.minTonForStorage);
        msgValue = msgValue - (storageFee + self.createWalletFee);

        send(SendParameters{
            to: contractAddress(newWallet),
            value: msgValue,
            mode: SendIgnoreErrors,
            body: InternalInitWalletSettings{
                queryId: msg.queryId,
                amount: msg.amount,
                interval: msg.interval,
                next_buy_time: msg.next_buy_time,
                owner: sender()
            }.toCell(),
            code: newWallet.code,
            data: newWallet.data
        });
    }

    receive(msg: ClaimFees) {
        self.requireOwner();

        let claimableValue: Int = myBalance() - self.minTonForStorage * 2;

        send(SendParameters{
            to: self.owner,
            value: claimableValue,
            bounce: false,
            mode: SendIgnoreErrors,
            body: "Claimed rewards".asComment()
        });
    }

    receive(msg: UpdateCreateWalletFee) {
        self.requireOwner();

        self.createWalletFee = msg.fee;
    }

    bounced(src: bounced<InternalInitWalletSettings>) {
//        self.index = self.index - 1;
    }

    get fun get_wallet_address(address: Address): Address {
        let wallet: StateInit = self.getWalletStateInit(address);
        return contractAddress(wallet);
    }

    get fun get_create_wallet_fee(): Int {
        return self.createWalletFee;
    }

    fun getWalletStateInit(address: Address): StateInit {
        return initOf TonDcaWallet(myAddress(), address);
    }
}
