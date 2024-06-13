import {TonConnectButton} from "@tonconnect/ui-react";
import {useTonConnect} from "../hooks/useTonConnect";

import {Button, Card, Ellipsis, FlexBoxCol, FlexBoxRow, Input} from "./styled/styled";
import {useDcaMasterContract} from "../hooks/useDcaMasterContract";
import {useDcaWalletContract} from "../hooks/useDcaWalletContract";
import {useEffect, useMemo, useState} from "react";
import {USDT_MASTER_CONTRACT_ADDRESS} from "../utils/jetton-utils";
import {fromNano} from "ton";
import {Navbar} from "./navbar/Navbar";
import {CardWrapper} from "./CardWrapper";
import {BalanceCard} from "./balance/BalanceCard";
import {StatisticsCard} from "./statistics/StatisticsCard";

export function StyledDcaMaster() {
    const {connected} = useTonConnect();
    const {address, createNewWallet} = useDcaMasterContract()
    const {
        isDeployed: isWalletDeployed,
        tonBalance,
        settings,
        address: walletAddress,
        initUsdtJettonAddress,
        topUpWallet,
        withdrawJetton,
        withdrawTON,
        resume,
        stop,
        processPay,
        updateSettings,
        calculateTopUpTonAmount,
    } = useDcaWalletContract()

    const USD_JETTONS = [
        {symbol: 'USDT', address: USDT_MASTER_CONTRACT_ADDRESS},
    ]
    const [usdJettonMasterAddress, setUsdJettonMasterAddress] = useState<string>()
    const [topUpAmount, setTopUpAmount] = useState<number | string>('')
    const [withdrawAmount, setWithdrawAmount] = useState<number | string>('')
    // const tonTopUpAmount = calculateTopUpTonAmount(Number(topUpAmount));

    useEffect(() => {
        //@todo убрать
        console.log(settings)
    }, [settings])

    useEffect(() => {
        setUsdJettonMasterAddress(USD_JETTONS[0].address)
    }, [USD_JETTONS])

    const nextBuyTime = useMemo(() => {
        if (!settings?.next_buy_time) {
            return undefined
        }

        const date = new Date(settings.next_buy_time * 1000)

        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    }, [settings?.next_buy_time])

    return (
        <div className="container">
            <Navbar />

            <BalanceCard />

            <StatisticsCard />
        </div>
    )
}
