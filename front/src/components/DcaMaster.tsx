import {TonConnectButton} from "@tonconnect/ui-react";
import {useTonConnect} from "../hooks/useTonConnect";

import {Button, Card, Ellipsis, FlexBoxCol, FlexBoxRow, Input} from "./styled/styled";
import {useDcaMasterContract} from "../hooks/useDcaMasterContract";
import {useDcaWalletContract} from "../hooks/useDcaWalletContract";
import {useEffect, useMemo, useState} from "react";
import {USDT_MASTER_CONTRACT_ADDRESS} from "../utils/jetton-utils";
import {fromNano} from "ton";

export function DcaMaster() {
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
    const tonTopUpAmount = calculateTopUpTonAmount(Number(topUpAmount));

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
        <div className="Container">
            <TonConnectButton/>

            <Card>
                <FlexBoxCol>
                    <h3>DCA Master</h3>
                    <FlexBoxRow>
                        <b>Address:</b>
                        <Ellipsis>{address}</Ellipsis>
                    </FlexBoxRow>
                    <FlexBoxRow>
                        <b>Wallet Address:</b>
                        <Ellipsis>{walletAddress}</Ellipsis>
                    </FlexBoxRow>
                    <FlexBoxRow>
                        <b>TON Balance:</b>
                        <Ellipsis>{tonBalance ? fromNano(tonBalance) : 0}</Ellipsis>
                    </FlexBoxRow>
                    {settings && (
                        <>
                            <FlexBoxRow>
                                <b>Stopped:</b>
                                <Ellipsis>{settings.stopped ? 'Yes' : 'No'}</Ellipsis>
                            </FlexBoxRow>
                            <FlexBoxRow>
                                <b>Interval:</b>
                                <Ellipsis>{settings.interval}</Ellipsis>
                            </FlexBoxRow>
                            <FlexBoxRow>
                                <b>Next buy time:</b>
                                <Ellipsis>{nextBuyTime}</Ellipsis>
                            </FlexBoxRow>
                            <FlexBoxRow>
                                <b>Buy Amount:</b>
                                <Ellipsis>{settings.amount} USD</Ellipsis>
                            </FlexBoxRow>
                            <FlexBoxRow>
                                <b>Buys Count:</b>
                                <Ellipsis>{settings.buys_count}</Ellipsis>
                            </FlexBoxRow>
                            <FlexBoxRow>
                                <b>Avg Buy Price:</b>
                                <Ellipsis>{settings.avg_buy_price} USD</Ellipsis>
                            </FlexBoxRow>
                            <FlexBoxRow>
                                <b>USD Balance:</b>
                                <Ellipsis>{settings.usdt_balance} USD</Ellipsis>
                            </FlexBoxRow>
                        </>
                    )}

                    {!isWalletDeployed && (<Button
                        disabled={!connected}
                        className={`Button ${connected ? "Active" : "Disabled"}`}
                        onClick={() => {
                            createNewWallet();
                        }}
                    >
                        Create Wallet
                    </Button>)}

                    {isWalletDeployed && (
                        <>
                            {(!settings || !settings.usdt_jetton_address) && (
                                <>
                                    <FlexBoxRow>
                                        <b>USD Jetton</b>
                                        <select value={usdJettonMasterAddress}
                                                onChange={event => setUsdJettonMasterAddress(event.target.value)}>
                                            <option defaultChecked={true}></option>
                                            {USD_JETTONS.map(jetton => (
                                                <option key={jetton.address}
                                                        value={jetton.address}>{jetton.symbol}</option>
                                            ))}
                                        </select>
                                    </FlexBoxRow>
                                    <Button
                                        disabled={!connected || !walletAddress || !usdJettonMasterAddress}
                                        className={`Button ${connected || !walletAddress || !usdJettonMasterAddress ? "Active" : "Disabled"}`}
                                        onClick={() => {
                                            if (!usdJettonMasterAddress) {
                                                return
                                            }
                                            initUsdtJettonAddress(usdJettonMasterAddress);
                                        }}
                                    >
                                        Setup USD Jetton
                                    </Button>
                                </>
                            )}

                            <Button
                                disabled={!connected || !walletAddress}
                                className={`Button ${connected || !walletAddress ? "Active" : "Disabled"}`}
                                onClick={() => {
                                    const now = Math.floor(new Date().getTime() / 1000);
                                    updateSettings(0.01, 86400, now);
                                }}
                            >
                                Update Settings
                            </Button>

                            <Button
                                disabled={!connected || !walletAddress}
                                className={`Button ${connected || !walletAddress ? "Active" : "Disabled"}`}
                                onClick={() => {
                                    if (settings?.stopped) {
                                        resume()
                                        return
                                    }
                                    stop()
                                }}
                            >
                                {settings?.stopped ? 'Resume' : 'Stop'}
                            </Button>

                            <FlexBoxRow>
                                <b>Top Up Amount</b>
                                <Input
                                    type="number"
                                    value={topUpAmount}
                                    onChange={e => setTopUpAmount(Number(e.target.value))}
                                    step="0.01"
                                    min={0}
                                />
                                USD
                            </FlexBoxRow>

                            { !!tonTopUpAmount && (
                                <FlexBoxRow>
                                    <span style={{color: "gray"}}>Также будет запрошено {tonTopUpAmount.toFixed(2)} TON для оплаты комиссий сети на покупку.</span>
                                </FlexBoxRow>
                            )}

                            <Button
                                disabled={!connected || !walletAddress || !usdJettonMasterAddress || !topUpAmount}
                                className={`Button ${connected || !walletAddress || !usdJettonMasterAddress || !topUpAmount ? "Active" : "Disabled"}`}
                                onClick={() => {
                                    if (!usdJettonMasterAddress) {
                                        return
                                    }
                                    if (topUpAmount <= 0) {
                                        return;
                                    }
                                    topUpWallet(usdJettonMasterAddress, Number(topUpAmount));
                                }}
                            >
                                Top Up DCA Wallet
                            </Button>

                            <FlexBoxRow>
                                <b>Withdraw Amount</b>
                                <Input
                                    type="number"
                                    value={withdrawAmount}
                                    onChange={e => setWithdrawAmount(Number(e.target.value))}
                                    step="0.01"
                                    min={0}
                                    max={settings?.usdt_balance || 0}
                                />
                                USD
                            </FlexBoxRow>

                            <Button
                                disabled={!connected || !walletAddress || !usdJettonMasterAddress || !withdrawAmount}
                                className={`Button ${connected || !walletAddress || !usdJettonMasterAddress || !withdrawAmount ? "Active" : "Disabled"}`}
                                onClick={() => {
                                    if (!usdJettonMasterAddress) {
                                        return
                                    }
                                    if (withdrawAmount <= 0) {
                                        return;
                                    }
                                    withdrawJetton(Number(withdrawAmount));
                                }}
                            >
                                Withdraw USD
                            </Button>

                            <Button
                                disabled={!connected || !walletAddress}
                                className={`Button ${connected || !walletAddress ? "Active" : "Disabled"}`}
                                onClick={() => {
                                    const isConfirmed = confirm('DCA Strategy will be stopped. Are you sure?')
                                    if (isConfirmed) {
                                        withdrawTON();
                                    }
                                }}
                            >
                                Withdraw TONs
                            </Button>

                            <Button
                                disabled={!connected || !walletAddress || Boolean(settings && settings.stopped)}
                                className={`Button ${connected || !walletAddress || (settings && settings.stopped) ? "Active" : "Disabled"}`}
                                style={{backgroundColor: 'green'}}
                                onClick={() => {
                                    const isConfirmed = confirm('Are you ready?')
                                    if (isConfirmed) {
                                        processPay();
                                    }
                                }}
                            >
                                Process Pay
                            </Button>
                        </>
                    )}
                </FlexBoxCol>
            </Card>
        </div>
    )
}
