import "@stdlib/deploy";
import "@stdlib/ownable";

struct SwapData {
    transferred_op: Int as uint32;
    token_wallet1: Address;
    min_out: Int as coins;
    to_address: Address;
    has_ref: Int;
    ref_address: Address;
}

message(0x7362d09c) StonFiTransferNotification {
    op: Int as uint32;
    query_id: Int as uint64;
    jetton_amount: Int as coins;
    from_user: Address;
    ref_msg_data: SwapData;
}

struct ForwardPayloadValueValue {
    token_wallet: Address;
    min_out: Int as coins;
    to_address: Address;
    referral_address: Address?;
}

struct ForwardPayloadValue {
    sum_type: String;
    op_code: Int as uint32;
    value: ForwardPayloadValueValue;
}

struct ForwardPayload {
    is_right: Bool;
    value: ForwardPayloadValue;
}

//message(0x7362d09c) JettonNotify {
//    query_id: Int as uint64;
//    amount: Int as coins;
//    sender: Address;
//    forward_payload: ForwardPayload;
//}

message(0xd1db969b) StonFiRouterGetPoolAddressRequest {
    queryId: Int as uint64;
    token0: Address;
    token1: Address;
}

contract Swapper with Deployable, Ownable {

    const STONFI_GET_POOL_ADDRESS_MESSAGE: Int = 0xd1db969b;
    const STONFI_ROUTER_ADDRESS: Address = address("kQBsGx9ArADUrREB34W-ghgsCgBShvfUr4Jvlu-0KGc33a1n");
    const STONFI_TRANSFER_OP_CODE_SWAP: Int = 0x25938561;

    owner: Address;
    version: Int;
//    poolAddress: Address?;

    init(version: Int) {
        self.owner = sender();
        self.version = version;
//        self.poolAddress = null;
    }

    receive("Swap") {
        self.requireOwner();

//        let PROXY_TON: Address = address("kQAcOvXSnnOhCdLYc6up2ECYwtNNTzlmOlidBeCs5cFPV7AM"); // ProxyTON Master
//        let STON_JETTON_WALLET: Address = address("kQDB8JYMzpiOxjCx7leP5nYkchF72PdbWT1LV7ym1uAedDjr"); // STON Master
        let PROXY_TON: Address = address("kQCdC2b1GG1saybYxCwRfEqr4WlOexsQIcYcfMYObk_477vs"); // ProxyTON Wallet
        let STON_JETTON_WALLET: Address = address("kQA5Q513nGufKW9D7Rn_Wt9nyl7_NWJp03rpbapEcc8sny5f"); // STON Wallet

        let forwardPayload: Cell = beginCell()
            .storeUint(0x25938561, 32)
            .storeAddress(STON_JETTON_WALLET)
            .storeCoins(1)
            .storeAddress(sender())
            .storeUint(1, 1)
            .storeAddress(sender())
            .endCell();

        let payload: Cell = beginCell()
            .storeUint(0xf8a7ea5, 32)
            .storeUint(0, 64)
            .storeCoins(ton("0.01"))
            .storeAddress(self.STONFI_ROUTER_ADDRESS)
            .storeUint(0, 2)
            .storeCoins(1)
            .storeRef(forwardPayload)
            .endCell();

        send(SendParameters{
            to: PROXY_TON,
            value: 0,
            mode: SendRemainingValue | SendIgnoreErrors,
            body: payload
//            body: StonFiTransferNotification {
//                op: 0x7362d09c,
//                query_id: 1,
//                jetton_amount: ton("0.02"),
//                from_user: sender(),
//                ref_msg_data: SwapData {
//                    transferred_op: self.STONFI_TRANSFER_OP_CODE_SWAP,
//                    token_wallet1: STON_JETTON_WALLET,
//                    min_out: 1,
//                    to_address: sender(),
//                    has_ref: 1,
//                    ref_address: sender()
//                }
//            }.toCell()
        });
    }

//    receive("Pool") {
//        self.requireOwner();
//
//        let PROXY_TON: Address = address("kQAcOvXSnnOhCdLYc6up2ECYwtNNTzlmOlidBeCs5cFPV7AM"); // ProxyTON
//        let JETTON0: Address = address("kQDB8JYMzpiOxjCx7leP5nYkchF72PdbWT1LV7ym1uAedDjr"); // STON
//
//        send(SendParameters{
//            to: self.STONFI_ROUTER_ADDRESS,
//            value: 0,
//            mode: SendRemainingValue | SendIgnoreErrors,
//            body: StonFiRouterGetPoolAddressRequest {
//                queryId: 1,
//                token0: PROXY_TON,
//                token1: JETTON0
//            }.toCell()
//        });
//    }

//    receive(msg: Slice) {
//        let opCode: Int = msg.loadUint(32);
//        let queryId: Int = msg.loadUint(64);
//
//        if(opCode == self.STONFI_GET_POOL_ADDRESS_MESSAGE) {
//            self.poolAddress = msg.loadAddress();
//
//            send(SendParameters{
//                to: self.owner,
//                value: 0,
//                mode: SendRemainingValue | SendIgnoreErrors,
//                body: "Address received".asComment()
//            });
//        }
//            send(SendParameters{
//                to: self.owner,
//                value: 0,
//                mode: SendRemainingValue | SendIgnoreErrors,
//                body: "Invalid op_code".asComment()
//            });
//    }

    get fun get_balance(): Int {
        return myBalance();
    }

    get fun get_version(): Int {
        return self.version;
    }

//    get fun get_pool_address(): Address? {
//        return self.poolAddress;
//    }

}
