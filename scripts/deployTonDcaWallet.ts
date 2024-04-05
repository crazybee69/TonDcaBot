import { toNano } from '@ton/core';
import { TonDcaWallet } from '../wrappers/TonDcaWallet';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const tonDcaWallet = provider.open(await TonDcaWallet.fromInit());

    await tonDcaWallet.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(tonDcaWallet.address);

    // run methods on `tonDcaWallet`
}
