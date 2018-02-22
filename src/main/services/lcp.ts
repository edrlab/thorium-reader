import * as uuid from "uuid";

import { injectable} from "inversify";

import { ConfigDb } from "readium-desktop/main/db/config-db";

import { IDeviceIDManager } from "@r2-lcp-js/lsd/deviceid-manager";

const DEVICE_ID_KEY = "device_id";
const DEVICE_ID_PREFIX = "device_id_";

@injectable()
export class DeviceIdManager /* implements IDeviceIDManager */ {
    // Config database
    private configDb: ConfigDb;

    private deviceName: string;

    public constructor(deviceName: string, configDb: ConfigDb) {
        this.deviceName = deviceName;
        this.configDb = configDb;
    }

    public async checkDeviceID(key: string): Promise<string | undefined> {
        const deviceIdKey = DEVICE_ID_PREFIX + key;
        return this.getDeviceConfigValue(deviceIdKey);
    }

    public async getDeviceID(): Promise<string> {
        let deviceId = await this.getDeviceConfigValue(DEVICE_ID_KEY);

        if (deviceId === null) {
            deviceId = uuid.v4();

            this.configDb.putOrUpdate({
                identifier: "device",
                deviceId,
            });
        }

        return deviceId;
    }

    public async getDeviceNAME(): Promise<string> {
        return this.deviceName;
    }

    public async recordDeviceID(key: string) {
        const deviceIdKey = DEVICE_ID_PREFIX + key;
        let deviceId = await this.getDeviceConfigValue(deviceIdKey);

        if (deviceId === null) {
            // Create new device id
            deviceId = uuid.v4();
        }

        return this.configDb.putOrUpdate(
            Object.assign(
                {},
                this.getDeviceConfig(),
                { deviceIdKey:  deviceId},
            ),
        );
    }

    private async getDeviceConfig(): Promise<any> {
        const deviceConfig = await this.configDb.get("device");

        if (deviceConfig === null) {
            return {
                identifier: "device",
            };
        }

        return deviceConfig;
    }

    private async getDeviceConfigValue(key: string): Promise<any> {
        const deviceConfig = await this.getDeviceConfig();
        return deviceConfig[key];
    }
}
