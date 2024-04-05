import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'tact',
    target: 'contracts/ton_dca_wallet.tact',
    options: {
        external: true,
        debug: true,
    }
};
