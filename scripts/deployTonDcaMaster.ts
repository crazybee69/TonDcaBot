import { toNano } from '@ton/core';
import { TonDcaMaster } from '../wrappers/TonDcaMaster';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const tonDcaMaster = provider.open(await TonDcaMaster.fromInit(BigInt(Math.floor(Math.random() * 10000))));

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

    await provider.waitForDeploy(tonDcaMaster.address);

    console.log('ID', await tonDcaMaster.getId());
}
