import { TonClient } from "@ton/ton";


export function connectTonClient(network: "mainnet" | "testnet" | "custom"): TonClient {
    const endpoint: string = network == "testnet"
        ? "https://testnet.toncenter.com/api/v2/jsonRPC"
        : "https://toncenter.com/api/v2/jsonRPC";

    return new TonClient({
        endpoint: endpoint,
        apiKey: process.env.TONCENTER_API_KEY,
    });
}