import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    Sender,
    SendMode,
    toNano
} from "@ton/core";


export type NftItemConfig = {
    queryId: number;
    itemOwnerAddress: Address;
    itemIndex: number;
    amount: bigint;
    commonContentUrl: string;
    collectionAddress: Address;
}

export function NftItemConfigToCell(config: NftItemConfig): Cell {
    const body = beginCell();
    body.storeUint(1, 32);
    body.storeUint(config.queryId || 0, 64);
    body.storeUint(config.itemIndex, 64);
    body.storeCoins(config.amount);

    const contentUrl = beginCell()
        .storeBuffer(Buffer.from(config.commonContentUrl))
        .endCell();

    const nftItemContent = beginCell()
        .storeAddress(config.itemOwnerAddress)
        .storeRef(contentUrl)
        .endCell();

    body.storeRef(nftItemContent);

    return body.endCell();
}

export class NftItem implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new NftItem(address);
    }

    static createFromConfig(config: NftItemConfig, code: Cell, workchain = 0) {
        const data = NftItemConfigToCell(config);
        const init = {code, data};
        return new NftItem(contractAddress(workchain, init), init);
    }

    async mint(sender: Sender, config: NftItemConfig) {
        await sender.send({
            value: toNano("0.05"),
            to: config.collectionAddress,
            body: NftItemConfigToCell(config),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
        })
    }
}