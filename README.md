# TonDcaBot

## Project structure

- `contracts/ton_dca_master.tact` - The main contract that manages the deployment of wallet contracts
- `contracts/ton_dca_wallet.tact` - A wallet contract that implements DCA logic for any Wallet (V4 or greater)
- `front/*` - Files from the frontend repository were used as a beta UI for testing

### User flow

1. Interact with DCA Master to create a Dca Wallet (`CreateWallet` message)
2. Setting the USDT Jeton Address by sending an `InitUsdtJettonAddress` message
3. Topping up USDT Wallet (Jetton)
4. Handle buying TON via external message "ProcessPay"

Swap provided by STON.fi

![telegram-cloud-photo-size-2-5431441412781627680-y](https://github.com/crazybee69/TonDcaBot/assets/32307323/30953035-b237-46f3-a947-104440e952dd)
