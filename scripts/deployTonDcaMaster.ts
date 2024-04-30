import { toNano } from '@ton/core';
import { TonDcaMaster } from '../wrappers/TonDcaMaster';
import { NetworkProvider } from '@ton/blueprint';
import {TonDcaWallet} from "../build/TonDcaWallet/tact_TonDcaWallet";

export async function run(provider: NetworkProvider) {
    const tonDcaMaster = provider.open(await TonDcaMaster.fromInit());

    await tonDcaMaster.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(tonDcaMaster.address, 50);

    console.log('Master deployed. Owner:', await tonDcaMaster.getOwner(), 'Address: ', tonDcaMaster.address.toString());

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

    await provider.waitForDeploy(tonDcaWallet.address, 50);
}
