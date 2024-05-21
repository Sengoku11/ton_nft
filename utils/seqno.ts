import { TonClient } from "@ton/ton";
import { Address } from "@ton/core";
import { TimeError } from "@ton/sandbox";
import { constants } from "http2";


export async function getSeqno(client: TonClient, address: Address): Promise<number> {
    return (await client.runMethod(
        address,
        "seqno",
        []
    )).stack.readNumber();
}

export async function waitSeqno(seqno: number, client: TonClient, address: Address) {
    for (let attempt = 0; attempt < 10; attempt++) {
        const seqnoAfter = await getSeqno(client, address);
        if (seqnoAfter > seqno) return seqnoAfter;
        await sleep(2000);
    }

    throw new Error("Maximum attempts reached: The seqno did not increase within the expected timeframe.");
}

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}