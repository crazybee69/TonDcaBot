import {Address, toNano} from '@ton/core';
import {NetworkProvider} from '@ton/blueprint';
import {TonDcaMaster} from "../build/TonDcaMaster/tact_TonDcaMaster";
import {TonDcaWallet} from "../build/TonDcaWallet/tact_TonDcaWallet";

export async function run(provider: NetworkProvider) {
    const tonDcaMaster = provider.open(await TonDcaMaster.fromAddress(Address.parse("kQC9mwR27Uk_gMJDbf6b6EECysNU6mzD6IJlBO6DisOSzqHe")));

    const now = BigInt(Math.floor(new Date().getTime() / 1000))

    await tonDcaMaster.send(
        provider.sender(),
        {
            value: toNano('0.5'),
        },
        {
            $$type: 'CreateWallet',
            queryId: 0n,
            amount: 10n,
            interval: 86400n,
            next_buy_time: now + 86400n
        }
    );

    const tonDcaWallet = await TonDcaWallet.fromInit(tonDcaMaster.address, 0n)

    await provider.waitForDeploy(tonDcaWallet.address, 30);

    console.log('Wallet deployed. Address: ', tonDcaWallet.address.toString())
    // run methods on `tonDcaWallet`
}
