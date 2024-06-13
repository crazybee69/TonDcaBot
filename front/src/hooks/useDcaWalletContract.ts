import {useTonClient} from "./useTonClient";
import {useAsyncInitialize} from "./useAsyncInitialize";
import {useTonConnect} from "./useTonConnect";
import {Address, OpenedContract, toNano} from "ton-core";
import {CHAIN} from "@tonconnect/protocol";
import {CreateWallet} from "../../contracts/wrappers/TonDcaMaster";
import {useEffect, useState} from "react";
import TonDcaMaster from "../contracts/dcaMaster";
import TonDcaWallet from "../contracts/dcaWallet";
import {useQuery} from "@tanstack/react-query";
import {useDcaMasterContract} from "./useDcaMasterContract";
import TonWeb from "tonweb";
import {createJettonTransferMessage, getJettonWalletAddress, USDT_MASTER_CONTRACT_ADDRESS} from "../utils/jetton-utils";
import {generateQueryId} from "../utils/query-id-generator";
import {useTonWebApiProvider} from "./useTonWebApiProvider";
import {fromNano} from "ton";

const TON_FEE_PER_ONE_BUY = 0.355;

export type AddressType = string
export type AmountType = number | string

export type DcaWalletSettings = {
    owner: AddressType
    master: AddressType
    amount: AmountType,
    interval: number,
    stopped: boolean,
    next_buy_time: number
    usdt_balance: AmountType,
    usdt_jetton_address: AddressType | undefined,
    buys_count: number,
    avg_buy_price: AmountType,
}

export function useDcaWalletContract() {
    const {client} = useTonClient();
    const {sender, network} = useTonConnect();
    const {getWalletAddress, address: dcaMasterAddress} = useDcaMasterContract()

    const [walletAddress, setWalletAddress] = useState<string>()

    useEffect(() => {
        if (!sender.address?.toString() || !dcaMasterAddress) {
            return;
        }
        getWalletAddress().then((address) => setWalletAddress(address))
    }, [sender.address?.toString(), dcaMasterAddress])

    const dcaWalletContract = useAsyncInitialize(async () => {
        if (!client || !walletAddress) {
            return;
        }
        const contract = new TonDcaWallet(
            Address.parse(walletAddress)
        );
        return client.open(contract) as OpenedContract<TonDcaWallet>;
    }, [client, walletAddress]);

    const { data: tonBalance } = useQuery(
      ["wallet_ton_balance"],
      async () => {
        if (!client || !dcaWalletContract) return null;
        return await client.getBalance(dcaWalletContract.address)
      },
      { enabled: !!dcaWalletContract, refetchInterval: 30000 }
    );

    const {data: settings, isFetching, refetch} = useQuery<DcaWalletSettings | undefined>(
        ["wallet_settings"],
        async () => {
            if (!dcaWalletContract) {
                return undefined;
            }
            return await dcaWalletContract!.getWalletSettings() as DcaWalletSettings | undefined;
        },
        {enabled: !!dcaWalletContract, refetchInterval: 30000}
    );

    const isDeployed = Boolean(tonBalance && tonBalance > 0)

    const updateSettings = async (amount: number, interval: number, nextTimeBuy: number) => {
        if(!dcaWalletContract?.address){
            alert('DCA Wallet Address is unknown')
            return
        }

        const queryId = generateQueryId()
        await dcaWalletContract.sendUpdateWalletSettings(sender, queryId, toNano(amount.toString()), interval, nextTimeBuy)
    }

    const initUsdtJettonAddress = async (usdJettonMasterContract: string) => {
        if(!dcaWalletContract?.address){
            alert('DCA Wallet Address is unknown')
            return
        }

        const jettonWalletAddress = await getJettonWalletAddress(usdJettonMasterContract, dcaWalletContract.address.toString())
        const queryId = generateQueryId()

        await dcaWalletContract.sendInitUsdtJettonWallet(sender, queryId, Address.parse(jettonWalletAddress))
    }

    const calculateTopUpTonAmount = (usdAmount: number): number | undefined => {
        if (!settings || !tonBalance) {
            return undefined;
        }

        let availableTonBalance = Number(fromNano(tonBalance)) - TON_FEE_PER_ONE_BUY;
        if (availableTonBalance < 0) {
            availableTonBalance = 0
        }

        const buysCount = Math.floor((usdAmount + Number(settings.usdt_balance)) / Number(settings.amount))
        const calculatedAmount = (buysCount * TON_FEE_PER_ONE_BUY)
        if (calculatedAmount < availableTonBalance) {
            return TON_FEE_PER_ONE_BUY
        }

        return calculatedAmount - availableTonBalance
    }

    const topUpWallet = async (usdJettonMasterContract: string, amount: number) => {
        if(!sender?.address){
            alert('Can\'t identify sender address')
            return
        }
        if(!dcaWalletContract?.address){
            alert('DCA Wallet Contract not set')
            return
        }
        if(!settings){
            alert('DCA Wallet settings not loaded')
            return
        }
        if(!settings?.usdt_jetton_address){
            alert('USD Jetton DCA Wallet Address not set')
            return
        }

        const tonAmount = (calculateTopUpTonAmount(amount) || TON_FEE_PER_ONE_BUY).toFixed(2);
        const forwardTonAmount = toNano(tonAmount)
        const usdtWalletAddress = await getJettonWalletAddress(usdJettonMasterContract, sender.address.toString())
        const queryId = generateQueryId()
        const messageBody = createJettonTransferMessage({
            queryId,
            amount: toNano(amount.toString()),
            destination: dcaWalletContract.address,
            responseDestination: sender?.address ? sender.address : undefined,
            forwardTonAmount,
        })

        await sender.send({
            to: Address.parse(usdtWalletAddress),
            value: forwardTonAmount + toNano('0.2'),
            sendMode: 3,
            body: messageBody
        })
    }

    const withdrawJetton = async (amount: number) => {
        if(!dcaWalletContract?.address){
            alert('DCA Wallet Address is unknown')
            return
        }

        const queryId = generateQueryId()
        await dcaWalletContract.sendWithdrawUsdtJetton(sender, queryId, toNano(amount.toString()))
    }

    const withdrawTON = async () => {
        if(!dcaWalletContract?.address){
            alert('DCA Wallet Address is unknown')
            return
        }

        const queryId = generateQueryId()
        await dcaWalletContract.sendWithdrawTON(sender, queryId)
    }

    const stop = async () => {
        if(!dcaWalletContract?.address){
            alert('DCA Wallet Address is unknown')
            return
        }

        await dcaWalletContract.sendStop(sender)
    }

    const resume = async () => {
        if(!dcaWalletContract?.address){
            alert('DCA Wallet Address is unknown')
            return
        }

        await dcaWalletContract.sendResume(sender)
    }

    const processPay = async () => {
        if(!dcaWalletContract?.address){
            alert('DCA Wallet Address is unknown')
            return
        }

        await dcaWalletContract.sendProcessPay()
    }

    return {
        isDeployed,
        address: dcaWalletContract?.address.toString(),
        tonBalance,
        settings,
        isFetching,
        refetch,
        calculateTopUpTonAmount,
        updateSettings,
        initUsdtJettonAddress,
        topUpWallet,
        withdrawJetton,
        withdrawTON,
        stop,
        resume,
        processPay,
    };
}
