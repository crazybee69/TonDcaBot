import {Address, toNano} from '@ton/core';
import {NetworkProvider} from '@ton/blueprint';
import {TonDcaMaster} from "../build/TonDcaMaster/tact_TonDcaMaster";

export async function run(provider: NetworkProvider) {
    const tonDcaMaster = provider.open(await TonDcaMaster.fromAddress(Address.parse("kQCO-zvT2qP-j39EVAJcpWTNMcas4CGtzTOF2mb4cfNk5xKp")));

    const response  = await tonDcaMaster.getGetWalletAddress(0n);

    console.log(response)

    // await provider.waitForDeploy(tonDcaWallet.address);

    // run methods on `tonDcaWallet`
}
