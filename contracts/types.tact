struct WalletSettings {
    owner: Address;
    master: Address;
    amount: Int;
    interval: Int;
    stopped: Bool;
    next_buy_time: Int;
    usdt_balance: Int;
    usdt_jetton_address: Address?;
    buys_count: Int;
    avg_buy_price: Int;
}

message InternalInitWalletSettings {
    queryId: Int as uint64;
    amount: Int as uint32;
    interval: Int as uint32;
    next_buy_time: Int;
    owner: Address;
}

message UpdateWalletSettings {
    queryId: Int as uint64;
    amount: Int as uint32;
    interval: Int as uint32;
    next_buy_time: Int;
}

struct RefMsgData {
    transferred_op: Int as uint32;
    token_wallet1: Address;
}