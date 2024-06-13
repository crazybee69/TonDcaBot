import {Address, beginCell, Cell} from "ton-core";
import {useTonWebApiProvider} from "../hooks/useTonWebApiProvider";
import TonWeb from "tonweb";

export const USDT_MASTER_CONTRACT_ADDRESS = 'kQDB8JYMzpiOxjCx7leP5nYkchF72PdbWT1LV7ym1uAedDjr';

export function createJettonTransferMessage(params: {
    queryId: number;
    amount: bigint;
    destination: Address;
    responseDestination?: Address;
    customPayload?: Cell;
    forwardTonAmount: bigint;
    forwardPayload?: Cell;
}): Cell {
    const messageBody = beginCell()
        .storeUint(0xf8a7ea5, 32)
        .storeUint(params.queryId, 64)
        .storeCoins(params.amount)
        .storeAddress(params.destination)
        .storeAddress(
            params.responseDestination
                ? params.responseDestination
                : undefined,
        );

    if (params.customPayload) {
        messageBody.storeRef(params.customPayload).storeBit(true);
    } else {
        messageBody.storeBit(false);
    }

    messageBody.storeCoins(params.forwardTonAmount);

    if (params.forwardPayload) {
        messageBody.storeRef(params.forwardPayload).storeBit(true);
    } else {
        messageBody.storeBit(false);
    }

    return messageBody.endCell();
}

export async function getJettonWalletAddress(jettonMasterAddress: string, forAddress: string): Promise<string> {
    const {apiProvider} = useTonWebApiProvider()
    const {
        token: {
            jetton: {JettonMinter}
        }
    } = TonWeb;

    const jettonMaster = new JettonMinter(
        apiProvider,
        // @ts-ignore
        {
            address: jettonMasterAddress
        }
    );
    const jettonWalletAddress = await jettonMaster.getJettonWalletAddress(new TonWeb.Address(forAddress));

    return jettonWalletAddress.toString()
}