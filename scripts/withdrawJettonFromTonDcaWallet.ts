import {Address, toNano} from '@ton/core';
import {NetworkProvider} from '@ton/blueprint';
import {TonDcaWallet} from "../build/TonDcaWallet/tact_TonDcaWallet";

export async function run(provider: NetworkProvider) {
    const tonDcaWalletAddress = Address.parse('kQApwavbao_xzLTgPry_3MV-hmVU2jRF71EOJD3ZHPxkDuZu');
    const tonDcaWallet = provider.open(await TonDcaWallet.fromAddress(tonDcaWalletAddress));

    const balances = await tonDcaWallet.getGetJettonBalances()

    console.log('balances length: ' + balances.keys().length)
    balances.keys().map((address) => console.log('jetton: ' + address.toString() + ' amount: ' + balances.get(address)))

    if (balances.keys().length === 0) {
        console.log('Zero jetton balances')
        return
    }

    const jettonWalletAddress = balances.keys()[0]

    if (!jettonWalletAddress) {
        console.log('Invalid jettonWalletAddress')
        return
    }

    await tonDcaWallet.send(
        provider.sender(),
        {
            value: toNano('0.5'),
        },
        {
            $$type: 'WithdrawJetton',
            queryId: 0n,
            amount: toNano('0.01'),
            jetton_wallet: jettonWalletAddress,
        }
    );

    // await provider.waitForDeploy(tonDcaWallet.address);

    // run methods on `tonDcaWallet`
}
