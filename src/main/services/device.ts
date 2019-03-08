// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as uuid from "uuid";

import { injectable} from "inversify";

import { ConfigRepository } from "readium-desktop/main/db/repository/config";

import { IDeviceIDManager } from "@r2-lcp-js/lsd/deviceid-manager";

const DEVICE_ID_KEY = "device_id";
const DEVICE_ID_PREFIX = "device_id_";

@injectable()
export class DeviceIdManager implements IDeviceIDManager {
    // Config repository
    private configRepository: ConfigRepository;

    private deviceName: string;

    public constructor(deviceName: string, configRepository: ConfigRepository) {
        this.deviceName = deviceName;
        this.configRepository = configRepository;
    }

    public async checkDeviceID(key: string): Promise<string | undefined> {
        const deviceIdKey = DEVICE_ID_PREFIX + key;
        return this.getDeviceConfigValue(deviceIdKey);
    }

    public async getDeviceID(): Promise<string> {
        let deviceId = await this.getDeviceConfigValue(DEVICE_ID_KEY);

        if (!deviceId) {
            deviceId = uuid.v4();

            const config: any = {
                identifier: "device",
                value: {},
            };
            config.value[DEVICE_ID_KEY] = deviceId;
            await this.configRepository.save(config);
        }

        return deviceId;
    }

    public async getDeviceNAME(): Promise<string> {
        return this.deviceName;
    }

    public async recordDeviceID(key: string): Promise<void> {
        const deviceIdKey = DEVICE_ID_PREFIX + key;
        let deviceId = await this.getDeviceConfigValue(deviceIdKey);

        if (!deviceId) {
            // Create new device id
            deviceId = uuid.v4();
        }

        const deviceConfig = await this.getDeviceConfig();
        const config: any = Object.assign({}, deviceConfig);
        config.value[deviceIdKey] = deviceId;
        await this.configRepository.save(config);
    }

    private async getDeviceConfig(): Promise<any> {
        try {
            return await this.configRepository.get("device");
        } catch (error) {
            return {
                identifier: "device",
                value: {},
            };
        }
    }

    private async getDeviceConfigValue(key: string): Promise<any> {
        const deviceConfig = await this.getDeviceConfig();
        return deviceConfig.value[key];
    }
}
