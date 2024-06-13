import {useTonClient} from "./useTonClient";
import {useAsyncInitialize} from "./useAsyncInitialize";
import {useTonConnect} from "./useTonConnect";
import {Address, OpenedContract, toNano} from "ton-core";
import {CHAIN} from "@tonconnect/protocol";
import {useEffect, useState} from "react";
import TonDcaMaster from "../contracts/dcaMaster";
import {generateQueryId} from "../utils/query-id-generator";

const DCA_MASTER_CONTRACT_TESTNET_ADDRESS = 'EQCnux2UDqfazgjohAnMbT-lJ1JZgNhFkOKXIKYK_T6qs4E2';
const DCA_MASTER_CONTRACT_MAINNET_ADDRESS = '';

export function useDcaMasterContract() {
    const {client} = useTonClient();
    const {sender, network} = useTonConnect();

    const dcaMasterContract = useAsyncInitialize(async () => {
        if (!client) return;
        const contract = new TonDcaMaster(
            Address.parse(
                network === CHAIN.MAINNET
                    ? DCA_MASTER_CONTRACT_MAINNET_ADDRESS
                    : DCA_MASTER_CONTRACT_TESTNET_ADDRESS
            ) // replace with your address from tutorial 2 step 8
        );
        return client.open(contract) as OpenedContract<TonDcaMaster>;
    }, [client]);

    return {
        address: dcaMasterContract?.address.toString(),
        createNewWallet: () => {
            const now = Math.floor(new Date().getTime() / 1000)
            const interval = 86400
            const queryId = generateQueryId()
            //@todo рассчитывать адрес кошелька USDT и сразу создавать контракт с кошельком
            dcaMasterContract?.sendCreateWallet(sender, queryId, toNano('1'), interval, now + interval);
        },
        getWalletAddress: async () => {
            if(!dcaMasterContract) {
                return
            }
            if(!sender.address) {
                return
            }

            return await dcaMasterContract.getWalletAddress(sender.address)
        },
    };
}
