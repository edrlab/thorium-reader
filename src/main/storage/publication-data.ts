// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { injectable } from "inversify";
import * as fs from "node:fs";
import * as path from "node:path";
import debug_ from "debug";
import { __ulimit_file } from "../di";
import { IReaderStateReaderPersistence } from "src/common/redux/states/renderer/readerRootState";

const debug = debug_("readium-desktop:main/storage/pub-data");

const rmrf = async (dir: string) => {
    return await fs.promises.rm(dir, { recursive: true, retryDelay: 100, maxRetries: 3, force: true });
};

const jsonStringify = (d: any) => (__TH__IS_DEV__ || __TH__IS_CI__) ? JSON.stringify(d, null, 4) : JSON.stringify(d);

const isUUIDv4 = (uuid: string) => /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(uuid);
const assertUUIDv4 = (uuid: string) => {
    if (!isUUIDv4(uuid)) {
        throw new Error("not an uuidv4 identifier !");
    }
};

export type TFileTypePubData = Extract<keyof IReaderStateReaderPersistence, "locator" | "config" | "disableRTLFlip" | "divina" | "allowCustomConfig" | "noteTotalCount" | "pdfConfig"> | "bound";
type TFileStructPubData = {
    pubId: string,
    type: TFileTypePubData,
    fileHandle: fs.promises.FileHandle,
    jsonObj: object | undefined,
    mutex: Promise<void>,
};

@injectable()
export class PublicationData {
    private lock: boolean = false;
    /**
     * publication reader config directory from configDataFolderPath
     * aka: %appData%\config-data-json{-dev}/publication/<uuid>/
     */
    private publicationConfigPath: string;

    private files: Array<TFileStructPubData>;

    private filterFilesByType = (t: TFileTypePubData) => this.files!.filter(({type}) => type === t);

    private assertAndGetFileName = (type: TFileTypePubData) => {
        const fileName = type === "locator" ? "locator.json" : type === "config" ? "config.json" : type === "disableRTLFlip" ? "disableRTLFlip.json" : type === "divina" ? "divina.json" : type === "allowCustomConfig" ? "allowCustomConfig.json" : type === "noteTotalCount" ? "noteTotalCount.json" : type === "pdfConfig" ? "pdfConfig.json" : type === "bound" ? "bound.json" : "";
        if (!fileName) {
            throw new Error("fileType not found");
        }
        return fileName;
    };

    public constructor(publicationConfigPath: string) {
        this.publicationConfigPath = publicationConfigPath;
        this.files = [];
    }

    public getJsonObj(pubId: string, type: TFileTypePubData): object | undefined {
        assertUUIDv4(pubId);
        const file = this.filterFilesByType(type).find((a) => a.pubId === pubId);
        return file?.jsonObj;
    }

    public async destroy() {
        this.lock = true;
        const files = [...this.files];
        this.files = [];
        const filePromises = [];
        for (const file of files) {
            filePromises.push((async () => {
                try {
                    await Promise.race([file.mutex, new Promise<void>((_resolve, reject) => setTimeout(() => reject("TIMEOUT"), 100))]);
                } catch (e) {
                    debug(e);
                }
                try {
                    const p1 = (async () => {
                        await file.fileHandle.sync();
                        await file.fileHandle.close();
                    })();
                    const p2 = new Promise<void>((_resolve, reject) => setTimeout(() => reject("TIMEOUT"), 100));
                    await Promise.race([p1, p2]);
                } catch (e) {
                    debug(e);
                }
            })());
        }
        try {
            const res = await Promise.allSettled(filePromises);
            debug("Publication-data destroy() done");
            debug(res);
        } catch (e) {
            debug(`${e}`);
        }
    }

    public async open(pubId: string, type: TFileTypePubData) {
        if (this.lock) return ;
        assertUUIDv4(pubId);

        const fileName = this.assertAndGetFileName(type);

        if (__ulimit_file && this.files.length > __ulimit_file - 50) {
            debug(`BE CAREFUL, ULIMIT is soon reached, currently: ${this.files.length} files opened and ulimit is set to ${__ulimit_file}`);
        }

        debug(`${this.files.length} file(s) currently opened`);

        const file = this.filterFilesByType(type).find((a) => pubId === a.pubId);
        if (file) {
            return ; // already open
        }

        const publicationPath = path.join(this.publicationConfigPath, pubId);
        const filePath = path.join(publicationPath, fileName);

        for (let step = 0; step < 2; step++) {
            try {
                const fileHandle = await fs.promises.open(filePath, fs.constants.O_RDWR | fs.constants.O_CREAT, 0o666);
                const file_ = this.filterFilesByType(type).find((a) => pubId === a.pubId);
                if (file_) {
                    try {
                        await fileHandle.close();
                    } catch (e) {
                        debug(`${e}`);
                    }
                    return; // already open
                }

                const file = {
                    pubId,
                    type,
                    fileHandle,
                    jsonObj: undefined as TFileStructPubData["jsonObj"],
                    mutex: Promise.resolve(),
                } satisfies TFileStructPubData;

                this.files.push(file);

                file.mutex = file.mutex.then(async () => {
                    try {
                        const jsonStr = await fileHandle.readFile({ encoding: "utf-8" });
                        try {
                            if (jsonStr) {
                                const jsonObj = JSON.parse(jsonStr);
                                file.jsonObj = jsonObj;
                            }
                        } catch (e) {
                            debug(`${e}`);
                        }
                        debug(`${type} file opened on ${pubId}`);
                    } catch (e) {
                        debug(`${e}`);
                    }
                });
                await file.mutex;
            } catch (e) {
                debug(`${e}`);
                if (e.code === "ENOENT") {
                    try {
                        debug("create directory", publicationPath);
                        await fs.promises.mkdir(publicationPath /* DEFAULTS: , { recursive: false, mode: 0o777 } */);
                        continue;
                    } catch (e) {
                        debug(`${e}`);
                    }
                }
            }
            break;
        }
    }

    public async writeJsonObj(pubId: string, type: TFileTypePubData, jsonObj: object) {
        if (this.lock) return ;
        assertUUIDv4(pubId);

        this.assertAndGetFileName(type);

        let file = this.filterFilesByType(type).find((a) => pubId === a.pubId);
        if (!file) {
            await this.open(pubId, type);
            file = this.filterFilesByType(type).find((a) => pubId === a.pubId);
            if (!file) {
                debug("Error to write data to", type, "on", pubId);
                return ;
            }
        }

        file.mutex = file.mutex.then(async () => {
            const jsonStr = jsonStringify(jsonObj);
            try {
                await file.fileHandle.truncate(jsonStr.length);
                await file.fileHandle.write(jsonStr, 0, "utf-8");

                // Wait the end of the write to set it as local reference
                file.jsonObj = jsonObj;
            } catch (e) {
                debug(e);
            }

        });
        await file.mutex;
    }

    public async readJsonObj(pubId: string, type: TFileTypePubData): Promise<object | undefined> {
        if (this.lock) return undefined;
        assertUUIDv4(pubId);

        this.assertAndGetFileName(type);

        let file = this.filterFilesByType(type).find((a) => pubId === a.pubId);
        if (!file) {
            await this.open(pubId, type);
            file = this.filterFilesByType(type).find((a) => pubId === a.pubId);
            if (!file) {
                debug("Error to write data to", type, "on", pubId);
                return undefined;
            }
        }

        file.mutex = file.mutex.then(async () => {
            try {
                // flush before read
                await file.fileHandle.sync();
            } catch (e) {
                debug(`${e}`);
            }
            try {
                const jsonStr = await fs.promises.readFile(file.fileHandle, { encoding: "utf-8" });
                try {
                    if (jsonStr) {
                        const jsonObj = JSON.parse(jsonStr);
                        file.jsonObj = jsonObj;
                    }
                } catch (e) {
                    debug(`${e}`);
                    try {
                        await this.writeJsonObj(pubId, type, file.jsonObj);
                    } catch (e) {
                        debug(e);
                    }
                }

            } catch (e) {
                debug(`${e}`);
            }
        });
        await file.mutex;
        return file.jsonObj;
    }

    public async close(pubId: string) {
        if (this.lock) return;

        debug(`${this.files.length} file(s) currently opened before closing ${pubId}`);

        const files = this.files.filter((a) => a.pubId === pubId);
        this.files = this.files.filter((a) => a.pubId !== pubId);

        debug(`${files.length} file(s) will be closed because attached to ${pubId}`);

        for (const file of files) {
            try {
                try {
                    await file.mutex;
                } catch (e) {
                    debug(e);
                }
                try {
                    await file.fileHandle.sync();
                } catch (e) {
                    debug(e);
                }
                await file.fileHandle.close();
            } catch (e) {
                debug(`${e}`);
            }
        }

        debug(`${this.files.length} file(s) currently opened now`);
    }

    public async removePublication(pubId: string) {
        assertUUIDv4(pubId);

        await this.close(pubId);
        const publicationPath = path.join(this.publicationConfigPath, pubId);
        await rmrf(publicationPath);
    }

    public async listPublication() {

        const files = await fs.promises.readdir(this.publicationConfigPath, { withFileTypes: true} );
        debug("List publications from:", this.publicationConfigPath);
        const pubIds = [];
        for (const file of files) {
            try {
                debug(`\t${file.name} isDirectory=${file.isDirectory()} isFile=${file.isFile()}`);
                if (isUUIDv4(file.name) && file.isDirectory()) {
                    pubIds.push(file.name);
                }
            } catch {
                // ignore
            }
        }

        return pubIds;
    }
}
