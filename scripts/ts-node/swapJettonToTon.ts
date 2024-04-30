import TonWeb from 'tonweb';
import {mnemonicToWalletKey} from "@ton/crypto";
import {Router, ROUTER_REVISION, ROUTER_REVISION_ADDRESS} from "@ston-fi/sdk";
import {fromNano} from "@ton/core";

async function main() {
    const phrase = 'real job scatter just poem steak enrich false peace resemble scissors arctic general cupboard bleak bomb impulse grab describe hurt favorite orange attack scissors'
    const seed = await mnemonicToWalletKey(phrase.split(' '))
    // const wallet = WalletContractV4.create({publicKey: seed.publicKey, workchain: 0})

    const provider = new TonWeb.HttpProvider('https://testnet.toncenter.com/api/v2/jsonRPC', {apiKey: 'a33950c5ee0fdbfb96e33f71436fb30541cf95b74c93149e69e033ab14c077d7'});
    const tonweb = new TonWeb();

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

    const {
        token: {
            jetton: { JettonMinter },
        },
    } = TonWeb;



    const stonJettonMaster = new JettonMinter(
        provider,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        {
            address: JETTON0,
        },
    );
    const stonJettonWalletAddress = await stonJettonMaster.getJettonWalletAddress(
        new tonweb.Address('kQCkUOtE8k2vwSD0dhyJig-mvD7hVc6bJ1rxYKCA8Vkdfpec'),
    );

    // console.log(stonJettonWalletAddress.toString(true, true, false))
    // return


    const offerJetton = new JettonMinter(
        provider,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        {
            address: PROXY_TON,
        },
    );

    const offerJettonWalletAddress = await offerJetton.getJettonWalletAddress(
        new tonweb.Address(WALLET_ADDRESS),
    );

    console.log(offerJettonWalletAddress.toString(true, true, false))
    return

    const router = new Router(provider, {
        revision: ROUTER_REVISION.V1,
        // address: ROUTER_REVISION_ADDRESS.V1,
        address: "kQBsGx9ArADUrREB34W-ghgsCgBShvfUr4Jvlu-0KGc33a1n",
    });

    // transaction to swap 1.0 JETTON0 to JETTON1 but not less than 1 nano JETTON1
    const swapTxParams = await router.buildSwapJettonTxParams({
        // address of the wallet that holds offerJetton you want to swap
        userWalletAddress: WALLET_ADDRESS,
        // address of the jetton you want to swap
        offerJettonAddress: JETTON0,
        // amount of the jetton you want to swap
        offerAmount: new TonWeb.utils.BN('100000000'),
        // address of the jetton you want to receive
        askJettonAddress: PROXY_TON,
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
        to: swapTxParams.to.toString(true, true, false),
        amount: fromNano(swapTxParams.gasAmount.toNumber())
    })

    // const response = await wallet.methods.transfer({
    //     secretKey: seed.secretKey,
    //     toAddress: swapTxParams.to,
    //     amount: swapTxParams.gasAmount,
    //     seqno: (seqno || 1),
    //     payload: swapTxParams.payload,
    //     sendMode: 3,
    // }).send();
    //
    // console.log({response})
}

main()
