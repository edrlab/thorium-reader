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
import { IReaderStateReaderPersistence } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { rmrf } from "readium-desktop/utils/fs";

const debug = debug_("readium-desktop:main/storage/pub-data");

const jsonStringify = (d: any) => (__TH__IS_DEV__ || __TH__IS_CI__) ? JSON.stringify(d, null, 4) : JSON.stringify(d);

const isUUIDv4 = (uuid: string) => /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(uuid);
const assertUUIDv4 = (uuid: string) => {
    if (!isUUIDv4(uuid)) {
        throw new Error("not an uuidv4 identifier !");
    }
};
const timeout = (ms: number) => new Promise<never>((_, reject) => setTimeout(() => reject("TIMEOUT"), ms));

export type TFileTypePubData = Extract<keyof IReaderStateReaderPersistence, "locator" | "config" | "disableRTLFlip" | "divina" | "allowCustomConfig" | "noteTotalCount" | "pdfConfig"> | "bound";
type TFileStructPubData = {
    pubId: string,
    type: TFileTypePubData,
    fileHandle: fs.promises.FileHandle | undefined,
    filePath: string,
    jsonObj: object | undefined,
    mutex: Promise<void>,
    written: boolean,
};

@injectable()
export class PublicationData {


    // For the 3.4 release, this feature remains disabled.
    // Higher-level file handling (read/write) is already stable and sufficient.
    // When true, all reader registry publication folders are created at once.
    // When false, folders are only created when a publication is written for the first time.
    private _readWriteFileHandleEnabled = false;

    // Prevents further operations once the destroy phase has started
    private _lock: boolean = false;

    /**
     * publication reader config directory from configDataFolderPath
     * aka: %appData%\config-data-json{-dev}/publication/<uuid>/
     */
    private _publicationConfigPath: string;

    // List of file metadata associated with the publication
    private _files: Array<TFileStructPubData> = [];
    
    // Tracks visited publication IDs to prevent duplicate final disk persistence
    private _visitedPubIdSet: Set<string> = new Set();

    private filterFilesByType = (t: TFileTypePubData) => this._files!.filter(({type}) => type === t);
    
    private assertAndGetFileName = (type: TFileTypePubData) => {
        const fileName = type === "locator" ? "locator.json" : type === "config" ? "config.json" : type === "disableRTLFlip" ? "disableRTLFlip.json" : type === "divina" ? "divina.json" : type === "allowCustomConfig" ? "allowCustomConfig.json" : type === "noteTotalCount" ? "noteTotalCount.json" : type === "pdfConfig" ? "pdfConfig.json" : type === "bound" ? "bound.json" : "";
        if (!fileName) {
            throw new Error("fileType not found");
        }
        return fileName;
    };

    public constructor(publicationConfigPath: string) {
        this._publicationConfigPath = publicationConfigPath;
    }
    
    public get visited() {
        return this._visitedPubIdSet;
    }

    public clearVisitedPublicationSet() {
        this._visitedPubIdSet = new Set();
    }

    // prefer using readJsonObj instead
    // public getJsonObj(pubId: string, type: TFileTypePubData): object | undefined {
    //     assertUUIDv4(pubId);
    //     const file = this.filterFilesByType(type).find((a) => a.pubId === pubId);
    //     return file?.jsonObj;
    // }

    public async destroy() {
        this._lock = true;
        const tasks = this._files.map(async (file) => {
            await Promise.race([
                file.mutex,
                timeout(100),
            ]).catch(debug);

            if (this._readWriteFileHandleEnabled && file.fileHandle) {
                const syncAndClose = async () => {
                    await file.fileHandle.sync().catch(() => { });
                    await file.fileHandle.close();
                };
                await Promise.race([
                    syncAndClose(),
                    timeout(100),
                ]).catch(debug);
            }
        });
        const results = await Promise.allSettled(tasks);
        debug("Publication-data destroy() done");
        for (const r of results) {
            if (r.status === "rejected") {
                debug("ko!", r.reason);
            } else {
                debug("ok!");
            }
        }
    }

    private async open(op: "read" | "write", pubId: string, type: TFileTypePubData) {
        if (this._lock) return undefined;
        assertUUIDv4(pubId);

        debug(`Open ${type} to ${pubId}`);

        const fileName = this.assertAndGetFileName(type);

        if (this._readWriteFileHandleEnabled) {
            if (__ulimit_file && this._files.length > __ulimit_file - 50) {
                debug(`BE CAREFUL, ULIMIT is soon reached, currently: ${this._files.length} files opened and ulimit is set to ${__ulimit_file}`);
            } else if (__ulimit_file && this._files.length > __ulimit_file - 10) {
                // start closing opened file
                // not enable for the moment in the case of ulimit is a wrong number
                // macos/linux ulimit soft open limit to 1024 (256 for older MacOS which I think Thorium is not compatible)
                // windows: no open limit
            }
        }

        debug(`${this._files.length} file(s) currently opened`);

        let file = this.filterFilesByType(type).find((a) => pubId === a.pubId);
        const publicationPath = path.join(this._publicationConfigPath, pubId);
        const filePath = path.join(publicationPath, fileName);

        if (this._readWriteFileHandleEnabled) {
            if (file) {
                file.written = op === "write";
                return file;
            }
        } else {
            if (!file) {
                file = {
                    pubId,
                    type,
                    fileHandle: undefined,
                    filePath,
                    jsonObj: undefined,
                    mutex: Promise.resolve(),
                    written: false,
                };
                this._files.push(file);
            }
            if (op === "write" && !file.written) {
                await fs.promises.access(publicationPath, fs.constants.O_DIRECTORY | fs.constants.O_RDWR)
                    .then(() => {
                        file.written = true;
                    })
                    .catch(async (e) => {
                        if (e?.code === "ENOENT") {
                            debug("create directory", publicationPath);
                            await fs.promises.mkdir(publicationPath /* DEFAULTS: , { recursive: false, mode: 0o777 } */)
                                .catch((e) => debug(`${e}`));
                        }
                    });
            }
            return file;
        }


        for (let step = 0; step < 2; step++) {
            try {
                const fileHandle = await fs.promises.open(filePath, fs.constants.O_RDWR | fs.constants.O_CREAT);
                file = this.filterFilesByType(type).find((a) => pubId === a.pubId);
                if (file) {
                    try {
                        await fileHandle.close();
                    } catch (e) {
                        debug(`${e}`);
                    }
                    return file; // already open
                }

                file = {
                    pubId,
                    type,
                    fileHandle,
                    filePath,
                    jsonObj: undefined as TFileStructPubData["jsonObj"],
                    mutex: Promise.resolve(),
                    written: op === "write",
                } satisfies TFileStructPubData;

                this._files.push(file);

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
            } catch (e: any) {
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
        return file;
    }

    public async writeJsonObj(pubId: string, type: TFileTypePubData, jsonObj: object) {
        if (this._lock) return ;
        assertUUIDv4(pubId);

        debug(`Write ${type} to ${pubId}`);

        this._visitedPubIdSet.add(pubId);

        this.assertAndGetFileName(type);

        const file = await this.open("write", pubId, type);
        if (!file) {

            debug("Cannot write data to", type, "on", pubId);
            return;
        }

        file.mutex = file.mutex.then(async () => {
            const jsonStr = jsonStringify(jsonObj);
            try {
                if (this._readWriteFileHandleEnabled && file.fileHandle) {
                    await file.fileHandle.truncate(jsonStr.length);
                    await file.fileHandle.write(jsonStr, 0, "utf-8");
                } else {
                    await fs.promises.writeFile(file.filePath, jsonStr, { encoding: "utf-8", flush: true });
                }

                // Wait the end of the write to set it as local reference
                file.jsonObj = jsonObj;
            } catch (e) {
                debug(e);
            }

        });
        await file.mutex;
    }

    public async readJsonObj(pubId: string, type: TFileTypePubData): Promise<object | undefined> {
        if (this._lock) return undefined;
        assertUUIDv4(pubId);

        debug(`Read ${type} to ${pubId}`);

        this.assertAndGetFileName(type);

        const file = await this.open("read", pubId, type);
        if (!file) {
            debug("Cannot read data to", type, "on", pubId);
            return undefined;
        }

        file.mutex = file.mutex.then(async () => {
            if (file.jsonObj) {
                return;
            }
            try {
                if (this._readWriteFileHandleEnabled && file.fileHandle) {
                    // flush before read
                    await file.fileHandle.sync();
                }
            } catch (e) {
                debug(`${e}`);
            }
            try {
                let jsonStr: string;
                if (this._readWriteFileHandleEnabled && file.fileHandle) {
                    jsonStr = await fs.promises.readFile(file.fileHandle, { encoding: "utf-8" });
                } else {
                    jsonStr = await fs.promises.readFile(file.filePath, { encoding: "utf-8" });
                }
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

            } catch {
                // too loud
                // debug(`${e}`);
            }
        });
        await file.mutex;
        if (!file.jsonObj) {
            debug(`Empty ${type} read on ${pubId}`);
        }
        return file.jsonObj;
    }

    public async close(pubId: string) {
        if (this._lock) return;

        debug(`${this._files.length} file(s) currently opened before closing ${pubId}`);

        const files = this._files.filter((a) => a.pubId === pubId);
        this._files = this._files.filter((a) => a.pubId !== pubId);

        debug(`${files.length} file(s) will be closed because attached to ${pubId}`);

        for (const file of files) {
            try {
                await file.mutex;
            } catch (e) {
                debug(e);
            }
            if (this._readWriteFileHandleEnabled && file.fileHandle) {
                try {
                    await file.fileHandle.sync();
                } catch (e) {
                    debug(e);
                }
                try {
                    await file.fileHandle.close();
                } catch (e) {
                    debug(`${e}`);
                }
            }
        }

        debug(`${this._files.length} file(s) currently opened now`);
    }

    public async removePublication(pubId: string) {
        assertUUIDv4(pubId);

        await this.close(pubId);
        const publicationPath = path.join(this._publicationConfigPath, pubId);
        await rmrf(publicationPath);
    }

    public async listPublication() {

        const files = await fs.promises.readdir(this._publicationConfigPath, { withFileTypes: true} );
        debug("List publications from:", this._publicationConfigPath);
        const pubIds: string[] = [];
        for (const file of files) {
            try {
                debug(`\t${file.name} isDirectory=${file.isDirectory()} isFile=${file.isFile()}`);
                if (isUUIDv4(file.name) && file.isDirectory() && !pubIds.includes(file.name)) {
                    pubIds.push(file.name);
                }
            } catch {
                // ignore
            }
        }

        return pubIds;
    }
}
