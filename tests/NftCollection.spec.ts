import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { NftCollection } from '../wrappers/NftCollection';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('NftCollection', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('NftCollection');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let nftCollection: SandboxContract<NftCollection>;
    const metadataIPFSHash: string = "Qmaki2xD3XHnr4rZgq76JSbkaW3tPXyvesAp57tguwwSn1";
    const expectedNextIndex = 5;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');

        const collectionData = {
            ownerAddress: deployer.address!,
            royaltyPercent: 0.001, // 0.05 = 5%
            royaltyAddress: deployer.address!,
            nextItemIndex: expectedNextIndex,
            collectionContentUrl: `ipfs://${metadataIPFSHash}/collection.json`,
            commonContentUrl: `ipfs://${metadataIPFSHash}/`,
            nftItemCodeCell: await compile('NftItem')
        };

        nftCollection = blockchain.openContract(NftCollection.createFromConfig(collectionData, code));

        const deployResult = await nftCollection.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: nftCollection.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and nftCollection are ready to use
    });

    it('should return nextIndex', async() => {
        const nextIndex = await nftCollection.getNextIndex();

        expect(nextIndex).toBe(BigInt(expectedNextIndex));
    })
});
