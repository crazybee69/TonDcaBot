import {Swapper} from '../wrappers/Swapper';
import {NetworkProvider} from '@ton/blueprint';
import {fromNano} from "@ton/core";

export async function run(provider: NetworkProvider) {
    const swapper = provider.open(await Swapper.fromInit(555n));

    console.log('Address:', swapper.address)
    console.log('Balance:', fromNano(await swapper.getGetBalance()))
    console.log('Version:', await swapper.getGetVersion())

    // const response = await swapper.send(
    //     provider.sender(),
    //     {
    //         value: toNano('0.05'),
    //     },
    //     "Swap"
    // );
    //
    // console.log(response)

    // run methods on `swapper`
}
