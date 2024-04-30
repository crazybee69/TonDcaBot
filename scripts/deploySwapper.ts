import { toNano } from '@ton/core';
import { Swapper } from '../wrappers/Swapper';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const swapper = provider.open(await Swapper.fromInit(180494n));

    await swapper.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(swapper.address);

    // run methods on `swapper`
}
