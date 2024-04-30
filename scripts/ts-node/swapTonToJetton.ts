import TonWeb from 'tonweb';
import {mnemonicToWalletKey} from "@ton/crypto";
import {Router, ROUTER_REVISION, ROUTER_REVISION_ADDRESS} from "@ston-fi/sdk";
import {fromNano, toNano} from "@ton/core";

async function main() {
    const phrase = 'real job scatter just poem steak enrich false peace resemble scissors arctic general cupboard bleak bomb impulse grab describe hurt favorite orange attack scissors'
    const seed = await mnemonicToWalletKey(phrase.split(' '))
    // const wallet = WalletContractV4.create({publicKey: seed.publicKey, workchain: 0})

    const provider = new TonWeb.HttpProvider('https://testnet.toncenter.com/api/v2/jsonRPC', {apiKey: 'a33950c5ee0fdbfb96e33f71436fb30541cf95b74c93149e69e033ab14c077d7'});
    const tonweb = new TonWeb();

    // const wallet = tonweb.wallet.create({publicKey: seed.publicKey});
    const wallet = new tonweb.wallet.all.v4R2(provider, {publicKey: seed.publicKey});

    const seqno = await wallet.methods.seqno().call();
    const address = await wallet.getAddress();
    const balance = await tonweb.getBalance(address);
    await new Promise((resolve) => setTimeout(() => resolve(true), 1000))

    console.log({
        address: address.toString(true, true, false),
        balance,
        seqno,
    })

    const WALLET_ADDRESS = '0QBza5vZDciVYS5K7pnmcJBUKQq1V4qD7ihzD0OZstqnJd5t'; // ! replace with your address
    const JETTON0 = 'kQDB8JYMzpiOxjCx7leP5nYkchF72PdbWT1LV7ym1uAedDjr'; // STON
    const PROXY_TON = 'kQAcOvXSnnOhCdLYc6up2ECYwtNNTzlmOlidBeCs5cFPV7AM'; // ProxyTON

    const router = new Router(provider, {
        revision: ROUTER_REVISION.V1,
        // address: ROUTER_REVISION_ADDRESS.V1,
        address: "kQBsGx9ArADUrREB34W-ghgsCgBShvfUr4Jvlu-0KGc33a1n",
    });

    // Because TON is not a jetton, to be able to swap TON to jetton
    // you need to use special SDK method to build transaction to swap TON to jetton
    // using proxy jetton contract.

    // transaction to swap 1.0 TON to JETTON0 but not less than 1 nano JETTON0
    const tonToJettonTxParams = await router.buildSwapProxyTonTxParams({
        // address of the wallet that holds TON you want to swap
        userWalletAddress: WALLET_ADDRESS,
        proxyTonAddress: PROXY_TON,
        // amount of the TON you want to swap
        offerAmount: new TonWeb.utils.BN(toNano('10').toString()),
        // address of the jetton you want to receive
        askJettonAddress: JETTON0,
        // minimal amount of the jetton you want to receive as a result of the swap.
        // If the amount of the jetton you want to receive is less than minAskAmount
        // the transaction will bounce
        minAskAmount: new TonWeb.utils.BN(1),
        // query id to identify your transaction in the blockchain (optional)
        queryId: 1,
        // address of the wallet to receive the referral fee (optional)
        referralAddress: undefined,
    });

    console.log({
        to: tonToJettonTxParams.to.toString(true, true, false),
        amount: fromNano(tonToJettonTxParams.gasAmount.toNumber()),
    })

    const response = await wallet.methods.transfer({
        secretKey: seed.secretKey,
        toAddress: tonToJettonTxParams.to,
        amount: tonToJettonTxParams.gasAmount,
        seqno: (seqno || 1),
        payload: tonToJettonTxParams.payload,
        sendMode: 3,
    }).send();

    console.log({response})
}

main()
