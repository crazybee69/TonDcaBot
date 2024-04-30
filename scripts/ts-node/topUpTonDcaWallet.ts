import {mnemonicToWalletKey} from "@ton/crypto";
import TonWeb from "tonweb";
import {createJettonTransferMessage} from "@ston-fi/sdk";

async function main() {
    const phrase = 'real job scatter just poem steak enrich false peace resemble scissors arctic general cupboard bleak bomb impulse grab describe hurt favorite orange attack scissors'
    const seed = await mnemonicToWalletKey(phrase.split(' '))
    const tonDcaWalletAddress = 'kQDxCZdoCHNQv4HXNyICywvMo2SVDYXd4-a3Gu5uolp7Ao7P';


    const apiProvider = new TonWeb.HttpProvider('https://testnet.toncenter.com/api/v2/jsonRPC', {apiKey: 'a33950c5ee0fdbfb96e33f71436fb30541cf95b74c93149e69e033ab14c077d7'});
    const tonweb = new TonWeb();

    const wallet = new tonweb.wallet.all.v4R2(apiProvider, {publicKey: seed.publicKey});
    const walletAddress = await wallet.getAddress();

    const {
        token: {
            jetton: {JettonMinter},
        },
    } = TonWeb;

    const STON_JETTON_MASTER_ADDRESS = 'kQDB8JYMzpiOxjCx7leP5nYkchF72PdbWT1LV7ym1uAedDjr'; // STON
    const jettonMaster = new JettonMinter(
        apiProvider,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        {
            address: STON_JETTON_MASTER_ADDRESS,
        },
    );
    const myJettonWalletAddress = await jettonMaster.getJettonWalletAddress(walletAddress);

    const payload = createJettonTransferMessage({
        queryId: 0,
        amount: new TonWeb.utils.BN('20000000'),//STON
        destination: new tonweb.Address(tonDcaWalletAddress),
        forwardTonAmount: new TonWeb.utils.BN('300000000'),//TON для обработки зачисления внутри DCA Wallet
    });

    const seqno = await wallet.methods.seqno().call();
    await wallet.methods.transfer({
        secretKey: seed.secretKey,
        toAddress: myJettonWalletAddress,
        amount: new TonWeb.utils.BN('450000000'),
        seqno: (seqno || 1),
        payload: payload,
        sendMode: 3,
    }).send();
}

main()
