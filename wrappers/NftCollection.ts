import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    toNano
} from '@ton/core';
import { encodeOffChainContent } from "../utils/encoding";

export type NftCollectionConfig = {
    ownerAddress: Address;
    royaltyPercent: number;
    royaltyAddress: Address;
    nextItemIndex: number;
    collectionContentUrl: string;
    commonContentUrl: string;
    nftItemCodeCell: Cell;
};

export function nftCollectionConfigToCell(config: NftCollectionConfig): Cell {
    const dataCell = beginCell();

    dataCell.storeAddress(config.ownerAddress);
    dataCell.storeUint(config.nextItemIndex, 64);

    const contentCell = beginCell();

    const collectionContent = encodeOffChainContent(config.collectionContentUrl);

    const commonContent = beginCell();
    commonContent.storeBuffer(Buffer.from(config.commonContentUrl));

    contentCell.storeRef(collectionContent);
    contentCell.storeRef(commonContent.asCell());
    dataCell.storeRef(contentCell);

    dataCell.storeRef(config.nftItemCodeCell);

    const royaltyBase = 1000;
    const royaltyFactor = Math.floor(config.royaltyPercent * royaltyBase);

    const royaltyCell = beginCell();
    royaltyCell.storeUint(royaltyFactor, 16);
    royaltyCell.storeUint(royaltyBase, 16);
    royaltyCell.storeAddress(config.royaltyAddress);
    dataCell.storeRef(royaltyCell);

    return dataCell.endCell();
}

export class NftCollection implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new NftCollection(address);
    }

    static createFromConfig(config: NftCollectionConfig, code: Cell, workchain = 0) {
        const data = nftCollectionConfigToCell(config);
        const init = { code, data };
        return new NftCollection(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async getNextIndex(provider: ContractProvider) {
        const {stack} = await provider.get("get_collection_data", []);

        return stack.readBigNumber();
    }

    public async topUpBalance(
        sender: Sender,
        nftAmount: number
    ) {
        const amount = toNano(nftAmount * 0.026);

        await sender.send({
            value: amount,
            to: this.address
        })
    }
}

