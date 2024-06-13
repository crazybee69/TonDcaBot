import TonWeb from "tonweb";

export const useTonWebApiProvider = () => {
    //@todo network
    const apiProvider = new TonWeb.HttpProvider(
        'https://testnet.toncenter.com/api/v2/jsonRPC',
        {apiKey: 'a33950c5ee0fdbfb96e33f71436fb30541cf95b74c93149e69e033ab14c077d7'}
    )

    return {
        apiProvider,
    }
}