import { injectable} from "inversify";

import { ConfigDb } from "readium-desktop/main/db/config-db";

const SECRET_CONFIG_ID = "secret";

@injectable()
export class SecretManager {
    // Config database
    private configDb: ConfigDb;

    private secrets: string[];

    public constructor(configDb: ConfigDb) {
        this.configDb = configDb;
        this.secrets = null;
    }

    public async getAllSecrets(): Promise<string[]> {
        if (this.secrets === null) {
            try {
                const secretConfig = await this.configDb.get(SECRET_CONFIG_ID);
                this.secrets = secretConfig.secrets;
            } catch (error) {
                this.secrets = [];
            }
        }

        return this.secrets;
    }

    public async storeSecret(secret: string): Promise<void> {
        if (this.secrets.indexOf(secret) === -1) {
            // new secret
            this.secrets.push(secret);
        }

        await this.configDb.putOrUpdate({
            identifier: SECRET_CONFIG_ID,
            secrets: this.secrets,
        });
    }
}
