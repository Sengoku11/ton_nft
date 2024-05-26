import { toNano } from '@ton/core';
import { NftCollection } from '../wrappers/NftCollection';
import { compile, NetworkProvider } from '@ton/blueprint';
import { updateEnv } from "../utils/updateEnv";

export async function run(provider: NetworkProvider) {
    const metadataIPFSHash: string = process.env.METADATA_IPFS_HASH as string;

    const collectionData = {
        ownerAddress: provider.sender().address!,
        royaltyPercent: 0.004, // 0.05 = 5%
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

    updateEnv('NFT_COLLECTION_ADDRESS', nftCollection.address)
}
