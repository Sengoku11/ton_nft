import { NetworkProvider } from "@ton/blueprint";
import { Address, beginCell, Cell, Dictionary, SendMode, toNano } from "@ton/core";
import { readdir } from "fs/promises";


export async function run(provider: NetworkProvider) {
    const nftStorageFee = toNano('0.05');
    const metadataFolderPath = "./data/metadata"
    const collectionAddress = Address.parse("EQBCKeMlR_1isBfrHdSOhKCLNH_XmANCYojLec4Gsnc4uxJc");

    const files = (await readdir(metadataFolderPath)).filter(file => !file.includes("collection.json"));
    const nftDict = Dictionary.empty<number, Cell>()
    files.forEach((file, i) => {
        nftDict.set(i, beginCell()
            .storeAddress(provider.sender().address!)
            .storeRef(beginCell()
                .storeBuffer(Buffer.from(file))
                .endCell()
            )
            .endCell()
        );
    })

    const bodyCell = beginCell()
        .storeUint(2, 32)   // OP
        .storeUint(0, 64)   // queryId
        .storeDict(nftDict, Dictionary.Keys.Uint(64), {
            serialize: (src, builder) => {
                builder.storeCoins(nftStorageFee);
                builder.storeRef(src);
            },
            parse: (src) => {
                return beginCell()
                    .storeCoins(src.loadCoins())
                    .storeRef(src.loadRef())
                    .endCell();
            }
        })
        .endCell();

    await provider.sender().send({
        value: toNano(files.length * 0.05 + 0.05),
        to: collectionAddress,
        body: bodyCell,
        sendMode: SendMode.PAY_GAS_SEPARATELY,
    })
}