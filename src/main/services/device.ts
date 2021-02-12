// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { injectable } from "inversify";
import { ConfigDocument } from "readium-desktop/main/db/document/config";
import {
    ExcludeTimestampableWithPartialIdentifiable,
} from "readium-desktop/main/db/repository/base";
import { ConfigRepository } from "readium-desktop/main/db/repository/config";
import { v4 as uuidv4 } from "uuid";

import { IDeviceIDManager } from "@r2-lcp-js/lsd/deviceid-manager";

const DEVICE_ID_KEY = "device_id";
const DEVICE_ID_PREFIX = "device_id_";

const debug = debug_("readium-desktop:main#services/device");

export interface DeviceConfig {
    device_id: string; // see DEVICE_ID_KEY in services device.ts
    [deviceIdKey: string]: string; // see DEVICE_ID_PREFIX in services device.ts
}

@injectable()
export class DeviceIdManager implements IDeviceIDManager {

    // CONSTRUCTOR INJECTION!
    // inject(diSymbolTable["config-repository"])
    private readonly configRepository: ConfigRepository<DeviceConfig>;

    private readonly deviceName: string;

    public constructor(
        deviceName: string,
        configRepository: ConfigRepository<DeviceConfig>, // INJECTED!
    ) {
        this.deviceName = deviceName;
        this.configRepository = configRepository;
    }

    public async checkDeviceID(key: string): Promise<string | undefined> {
        const deviceIdKey = DEVICE_ID_PREFIX + key;
        const val = await this.getDeviceConfigValue(deviceIdKey);

        debug("DeviceIdManager checkDeviceID:");
        debug(key);
        debug(val);

        return val;
    }

    public async getDeviceID(): Promise<string> {
        let deviceId = await this.getDeviceConfigValue(DEVICE_ID_KEY);

        debug("DeviceIdManager getDeviceID:");
        debug(deviceId);

        if (!deviceId) {
            deviceId = uuidv4();

            const newDeviceConfigDocument: ExcludeTimestampableWithPartialIdentifiable<ConfigDocument<DeviceConfig>> = {
                identifier: "device",
                value: {} as DeviceConfig,
            };
            newDeviceConfigDocument.value[DEVICE_ID_KEY] = deviceId;
            await this.configRepository.save(newDeviceConfigDocument);

            debug(newDeviceConfigDocument);
        }

        return deviceId;
    }

    public async getDeviceNAME(): Promise<string> {
        return this.deviceName;
    }

    public async recordDeviceID(key: string): Promise<void> {
        const deviceId = await this.getDeviceID();
        const deviceIdKey = DEVICE_ID_PREFIX + key;

        const deviceConfigDocument = await this.getDeviceConfig();
        const deviceConfig = deviceConfigDocument.value;
        const newDeviceConfig: DeviceConfig = Object.assign(
            {},
            deviceConfig,
        );
        newDeviceConfig[deviceIdKey] = deviceId;
        // tslint:disable-next-line: max-line-length
        const newDeviceConfigDocument: ExcludeTimestampableWithPartialIdentifiable<ConfigDocument<DeviceConfig>> =
            Object.assign(
                {},
                deviceConfigDocument,
                {
                    value: newDeviceConfig,
                } as ConfigDocument<DeviceConfig>,
            );
        await this.configRepository.save(newDeviceConfigDocument);

        debug("DeviceIdManager recordDeviceID:");
        debug(key);
        debug(newDeviceConfigDocument);
    }

    private async getDeviceConfig(): Promise<ConfigDocument<DeviceConfig>> {
        try {
            return await this.configRepository.get("device");
        } catch (_error) {
            return {
                identifier: "device",
                value: {} as DeviceConfig,
            } as ConfigDocument<DeviceConfig>;
        }
    }

    private async getDeviceConfigValue(key: string): Promise<string> {
        const deviceConfigDocument = await this.getDeviceConfig();
        const deviceConfig = deviceConfigDocument.value;
        const val = deviceConfig[key];

        debug("DeviceIdManager getDeviceConfigValue:");
        debug(deviceConfigDocument);
        debug(`${key} => ${val}`);

        return val;
    }
}
