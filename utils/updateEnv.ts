import * as fs from 'fs';
import * as dotenv from 'dotenv';


export function updateEnv(key: string, value: any) {
    const path = '.env';
    const envConfig = dotenv.parse(fs.readFileSync(path));

    envConfig[key] = value;

    const updatedEnvContent = Object.entries(envConfig)
        .map(([k, v]) => `${k}=${v}`)
        .join('\n');

    fs.writeFileSync(path, updatedEnvContent);

    return
}