import { updateEnv } from "../utils/updateEnv";
import pinataSDK from "@pinata/sdk";
import { readdirSync } from "fs";
import path from "path";
import { readFile, writeFile } from "fs/promises";


export async function run() {
    const metadataFolderPath: string = './data/metadata';
    const imagesFolderPath: string = './data/images';

    console.log("Started uploading images to IPFS...")
    const imagesIPFSHash = await uploadFolderToIPFS(imagesFolderPath);
    console.log(
        `Successfully uploaded the pictures to ipfs: https://gateway.pinata.cloud/ipfs/${imagesIPFSHash}`
    );

    console.log("Started uploading metadata files to IPFS...");
    await updateMetadataFiles(metadataFolderPath, imagesIPFSHash);
    const metadataIPFSHash = await uploadFolderToIPFS(metadataFolderPath);
    console.log(
        `Successfully uploaded the metadata to ipfs: https://gateway.pinata.cloud/ipfs/${metadataIPFSHash}`
    );

    updateEnv("IMAGES_IPFS_HASH", imagesIPFSHash);
    updateEnv("METADATA_IPFS_HASH", metadataIPFSHash);
}

export async function uploadFolderToIPFS(folderPath: string): Promise<string> {
    const pinata = new pinataSDK({
        pinataApiKey: process.env.PINATA_API_KEY,
        pinataSecretApiKey: process.env.PINATA_SECRET_KEY,
    });

    try {
        const response = await pinata.pinFromFS(folderPath);

        return response.IpfsHash;
    } catch (error) {
        console.error('Error uploading folder to IPFS:', error);
        throw new Error('Failed to upload folder to IPFS');
    }
}

export async function updateMetadataFiles(metadataFolderPath: string, imagesIpfsHash: string) {
    const files = readdirSync(metadataFolderPath);

    for (const filename of files) {
        const filePath = path.join(metadataFolderPath, filename);
        const file = await readFile(filePath);
        const metadata = JSON.parse(file.toString());
        const baseName = path.parse(filename).name;

        metadata.image = baseName != "collection"
            ? `ipfs://${imagesIpfsHash}/${baseName}.jpg`
            : `ipfs://${imagesIpfsHash}/logo.jpg`

        await writeFile(filePath, JSON.stringify(metadata));
    }
}
