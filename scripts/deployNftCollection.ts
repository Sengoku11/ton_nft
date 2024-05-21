import { toNano } from '@ton/core';
import { NftCollection } from '../wrappers/NftCollection';
import { compile, NetworkProvider } from '@ton/blueprint';
import { updateMetadataFiles, uploadDataToIPFS, uploadFolderToIPFS } from "../utils/uploadToIPFS";
import { readdir } from "fs/promises";
import { getSeqno, waitSeqno } from "../utils/seqno";
import { connectTonClient } from "../utils/tonClient";

export async function run(provider: NetworkProvider) {
    const client = connectTonClient(provider.network())
    const metadataFolderPath: string = './data/metadata';
    const imagesFolderPath: string = './data/images';
    const {metadataIPFSHash} = await uploadDataToIPFS(metadataFolderPath, imagesFolderPath);
    // const metadataIPFSHash: string = "QmULdxmubTi7gYVktFenLRvWKHXiUgagY8Tn7YyU3eAc4s";

    const collectionData = {
        ownerAddress: provider.sender().address!,
        royaltyPercent: 0.001, // 0.05 = 5%
        royaltyAddress: provider.sender().address!,
        nextItemIndex: 0,
        collectionContentUrl: `ipfs://${metadataIPFSHash}/collection.json`,
        commonContentUrl: `ipfs://${metadataIPFSHash}/`,
        nftItemCodeCell: await compile('NftItem')
    };

    const nftCollection = provider.open(
        NftCollection.createFromConfig(collectionData, await compile('NftCollection'))
    );

    await nftCollection.sendDeploy(provider.sender(), toNano('0.05'));
    await provider.waitForDeploy(nftCollection.address);

    // Top up contract for NFT collection minting
    const files = (await readdir(metadataFolderPath)).filter(file => !file.includes("collection.json"));
    const seqno = await getSeqno(client, provider.sender().address!);
    await nftCollection.topUpBalance(provider.sender(), files.length)
    await waitSeqno(seqno, client, provider.sender().address!)
}
