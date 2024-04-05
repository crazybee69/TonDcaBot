struct WalletSettings {
    owner: Address;
    amount: Int;
    interval: Int;
    stopped: Bool;
    next_buy_time: Int;
//    jettonAddress: Address;
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

message(0x7362d09c) StonFiTransferNotification {
    queryId: Int as uint64;
    op: Int as uint32;
    jetton_amount: Int as coins;
    from_user: Address;
    ref_msg_data: RefMsgData;
}
