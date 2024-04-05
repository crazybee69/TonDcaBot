import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { Swapper } from '../wrappers/Swapper';
import '@ton/test-utils';

describe('Swapper', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let swapper: SandboxContract<Swapper>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        swapper = blockchain.openContract(await Swapper.fromInit(2n));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await swapper.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: swapper.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and swapper are ready to use
    });


    it('swap', async () => {
        const response = await swapper.send(deployer.getSender(), {value: toNano("0.2")}, "Swap")

        console.log(response)
    });
});
