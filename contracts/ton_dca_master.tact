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

contract TonDcaMaster with Deployable, Ownable {

    owner: Address;
    index: Int as uint32 = 0;
    minTonForStorage: Int = ton("0.03");
    createWalletFee: Int = ton("0.1");

    init() {
        self.owner = sender();
    }

    receive(msg: CreateWallet) {
        let newWallet: StateInit = self.getWalletStateInit(self.index);
        let msgValue: Int = context().value;
        let tonBalanceBeforeMsg: Int = myBalance() - msgValue;
        let storageFee: Int = self.minTonForStorage + min(tonBalanceBeforeMsg, self.minTonForStorage);
        msgValue = msgValue - (storageFee + self.createWalletFee);

        send(SendParameters{
            to: contractAddress(newWallet),
            value: msgValue,
            mode: SendIgnoreErrors,
            body: InternalInitWalletSettings{
                queryId: msg.queryId + 1,
                amount: msg.amount,
                interval: msg.interval,
                next_buy_time: msg.next_buy_time,
                owner: sender()
            }.toCell(),
            code: newWallet.code,
            data: newWallet.data
        });

        self.index = self.index + 1;
    }

    bounced(src: bounced<InternalInitWalletSettings>) {
//        dump(src);
//        send(SendParameters{
//            to: src.owner,
//            value: context().value,
//            mode: SendIgnoreErrors,
//            body: "Error when trying to create a DCA Strategy".asComment()
//        });

        self.index = self.index - 1;
    }

    get fun get_wallet_address(index: Int): Address {
        let wallet: StateInit = self.getWalletStateInit(index);
        return contractAddress(wallet);
    }

    get fun get_index(): Int {
        return self.index;
    }

    fun getWalletStateInit(index: Int): StateInit {
        return initOf TonDcaWallet(myAddress(), index);
    }
}
