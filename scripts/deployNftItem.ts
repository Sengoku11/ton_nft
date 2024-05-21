import { compile, NetworkProvider } from "@ton/blueprint";
import { NftCollection } from "../wrappers/NftCollection";
import { Address, toNano } from "@ton/core";
import { getSeqno, waitSeqno } from "../utils/seqno";
import { connectTonClient } from "../utils/tonClient";
import { readdir } from "fs/promises";
import { NftItem } from "../wrappers/NftItem";


export async function run(provider: NetworkProvider){
    const client = connectTonClient(provider.network())
    const metadataFolderPath: string = "./data/metadata";
    const files = (await readdir(metadataFolderPath)).filter(file => !file.includes("collection.json"));
    const nftItemCode = await compile('NftItem');
    const senderAddress = provider.sender().address!;
    const collectionAddress = Address.parse("EQDFnq-4qImZk7yGY3wKtNdvzGD-bpxWwBROC_YgfBwSjvtd");
    const collectionContract = provider.open(NftCollection.createFromAddress(collectionAddress));

    const nextIndex = Number(await collectionContract.getNextIndex());
    let index = 0;
    let seqno = await getSeqno(client, senderAddress);

    try {
        // Deploys the next file at nextIndex
        for (const file of files) {
            if (index < nextIndex) {
                console.log(`NFT at index ${index + 1} is already deployed.`);
                index++;

                continue
            }

            console.log(`Start deploy of ${index + 1} NFT`);
            const mintParams = {
                queryId: 0,
                itemOwnerAddress: senderAddress,
                itemIndex: nextIndex,
                amount: toNano("0.05"),
                commonContentUrl: file,
                collectionAddress: collectionAddress
            };

            const nftItem = provider.open(NftItem.createFromConfig(mintParams, nftItemCode));
            await nftItem.mint(provider.sender(), mintParams);

            seqno = await waitSeqno(seqno, client, senderAddress)
            console.log(`Successfully deployed ${index + 1} NFT`);

            // Mint only one NFT
            break
        }
    } catch (error) {
        console.log(`Caught error during sending nft: ${error}`)
    }
}