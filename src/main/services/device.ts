// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as fs from "fs";
import { injectable } from "inversify";
import { ConfigDocument } from "readium-desktop/main/db/document/config";
import { ConfigRepository } from "readium-desktop/main/db/repository/config";
import { tryCatch } from "readium-desktop/utils/tryCatch";
import { v4 as uuidv4 } from "uuid";

import { IDeviceIDManager } from "@r2-lcp-js/lsd/deviceid-manager";

import { lcpLsdDevicesFilePath } from "../di";

const DEVICE_ID_KEY = "device_id";
const DEVICE_ID_PREFIX = "device_id_";

const debug = debug_("readium-desktop:main#services/device");

export interface DeviceConfig {
    device_id: string; // see DEVICE_ID_KEY in services device.ts
    [deviceIdKey: string]: string; // see DEVICE_ID_PREFIX in services device.ts
}

let _cache: DeviceConfig = undefined;

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
        let val = await this.getDeviceConfigValue(deviceIdKey);
        if (val === "_") {
            const deviceId = await this.getDeviceConfigValue(DEVICE_ID_KEY);
            if (deviceId) {
                val = deviceId;
            }
        }

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

            // const newDeviceConfigDocument: ExcludeTimestampableWithPartialIdentifiable<ConfigDocument<DeviceConfig>> = {
            //     identifier: "device",
            //     value: {} as DeviceConfig,
            // };
            // newDeviceConfigDocument.value[DEVICE_ID_KEY] = deviceId;
            // await this.configRepository.save(newDeviceConfigDocument);

            const deviceConfig: DeviceConfig = {
                device_id: deviceId,
            };
            this.saveDeviceConfigJson(deviceConfig);
            debug(deviceConfig);
        }

        return deviceId;
    }

    public async getDeviceNAME(): Promise<string> {
        return this.deviceName;
    }

    public async recordDeviceID(key: string): Promise<void> {
        // const deviceId = await this.getDeviceID();
        const deviceIdKey = DEVICE_ID_PREFIX + key;

        const deviceConfig = await this.getDeviceConfigJson();
        const newDeviceConfig: DeviceConfig = Object.assign(
            {},
            deviceConfig,
        );
        newDeviceConfig[deviceIdKey] = "_"; // deviceId
        // tslint:disable-next-line: max-line-length
        // const newDeviceConfigDocument: ExcludeTimestampableWithPartialIdentifiable<ConfigDocument<DeviceConfig>> =
        //     Object.assign(
        //         {},
        //         deviceConfigDocument,
        //         {
        //             value: newDeviceConfig,
        //         } as ConfigDocument<DeviceConfig>,
        //     );
        // await this.configRepository.save(newDeviceConfigDocument);
        this.saveDeviceConfigJson(newDeviceConfig);

        debug("DeviceIdManager recordDeviceID:");
        debug(key);
        debug(newDeviceConfig);
    }

    public async absorbDBToJson() {
        const config = await this.getDeviceConfigJson();
        debug("+++++ LCP LSD absorbDBToJson ... ", config);
        // await this.saveDeviceConfigJson(config);
    }

    private async saveDeviceConfigJson(conf: DeviceConfig) {
        debug("LCP LSD saveDeviceConfigJson ... ", conf);

        _cache = conf;
        const str = JSON.stringify(conf);
        fs.promises.writeFile(lcpLsdDevicesFilePath, str, { encoding: "utf-8" });
    }
    private async getDeviceConfigJson(): Promise<DeviceConfig> {

        if (_cache) {
            debug("LCP LSD getDeviceConfig CACHE: ", _cache);
            return _cache;
        }

        debug("LCP LSD getDeviceConfig ...");

        const str = await tryCatch(() => fs.promises.readFile(lcpLsdDevicesFilePath, { encoding: "utf-8" }), "");
        if (str) {
            const json = JSON.parse(str);
            debug("LCP LSD getDeviceConfig from JSON: ", json);
            _cache = json;
            return json;
        }

        debug("LCP LSD getDeviceConfig from DB (migration) ...");

        const dbConfig = await this.getDeviceConfigDB();
        if (dbConfig?.value?.device_id) { // DEVICE_ID_KEY

            debug("LCP LSD getDeviceConfig DB TO JSON", dbConfig.value);

            this.saveDeviceConfigJson(dbConfig.value);
            return dbConfig.value;
        }

        return {} as DeviceConfig;
    }
    private async getDeviceConfigDB(): Promise<ConfigDocument<DeviceConfig>> {
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
        const deviceConfig = await this.getDeviceConfigJson();
        const val = deviceConfig[key];

        debug("DeviceIdManager getDeviceConfigValue:");
        // debug(deviceConfig);
        debug(`${key} => ${val}`);

        return val;
    }
}
