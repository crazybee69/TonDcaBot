import {
  Contract,
  ContractProvider,
  Sender,
  Address,
  Cell,
  contractAddress,
  beginCell, toNano,
} from "ton-core";

export default class TonDcaMaster implements Contract {

  async getWalletAddress(provider: ContractProvider, forAddress: Address) {
    const { stack } = await provider.get("get_wallet_address", [
      { type: "slice", cell: beginCell().storeAddress(forAddress).endCell() },
    ]);

    return stack.readAddress().toString();
  }

  async sendCreateWallet(provider: ContractProvider, via: Sender, queryId: number, amount: bigint, interval: number, nextBuyTime: number) {
    const messageBody = beginCell()
        .storeUint(340738312, 32)
        .storeUint(queryId, 64) // query id
        .storeUint(amount, 32)
        .storeUint(interval, 32)
        .storeInt(nextBuyTime, 257)
        .endCell();
    await provider.internal(via, {
      value: toNano("0.3"),
      body: messageBody,
    });
  }

  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell }
  ) {}
}
