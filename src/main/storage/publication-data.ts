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

const debug = debug_("readium-desktop:main/storage/pub-data");

const rmrf = async (dir: string) => {
    return await fs.promises.rm(dir, { recursive: true, retryDelay: 100, maxRetries: 3, force: true });
};

const isUUIDv4 = (uuid: string) => /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(uuid);
const assertUUIDv4 = (uuid: string) => {
    if (!isUUIDv4(uuid)) {
        throw new Error("not an uuidv4 identifier !");
    }
};

export type TFileType = "locator" | "config" | "disableRTLFlip" | "bound";

@injectable()
export class PublicationData {
    private lock: boolean = false;
    /**
     * publication reader config directory from configDataFolderPath
     * aka: %appData%\config-data-json{-dev}/publication/<uuid>/
     */
    private publicationConfigPath: string;

    private files: Array<{pubId: string, type: TFileType, fileHandle: fs.promises.FileHandle, data: string, }>;

    private filterFilesByType = (t: TFileType) => this.files.filter(({type}) => type === t);

    private assertAndGetFileName = (type: TFileType) => {
        const fileName = type === "locator" ? "locator.json" : type === "config" ? "config.json" : type === "disableRTLFlip" ? "disableRTLFlip.json" : type === "bound" ? "bound.json" : "";
        if (!fileName) {
            throw new Error("fileType not found");
        }
        return fileName;
    };

    public constructor(publicationConfigPath: string) {
        this.publicationConfigPath = publicationConfigPath;
        this.files = [];
    }

    public getDataRead(pubId: string, type: TFileType) {
        assertUUIDv4(pubId);
        const file = this.filterFilesByType(type).find((a) => a.pubId === pubId);
        return file?.data;
    }

    public async destroy() {
        this.lock = true;
        const files = [...this.files];
        this.files = [];
        for (const file of files) {
            try {
                await file.fileHandle.close();
            } catch (e) {
                debug(e);
            }
        }
    }

    public async open(pubId: string, type: TFileType) {
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
                const fileHandle = await fs.promises.open(filePath, fs.constants.O_RDWR | fs.constants.O_CREAT, 0o644);
                const file = {
                    pubId,
                    type,
                    fileHandle,
                    data: "",
                };
                this.files.push(file);
                const data = await fileHandle.readFile({ encoding: "utf-8" });
                file.data = data;
                debug(`${type} file opened on ${pubId}`);
            } catch (e) {
                debug(e);
                if (e.code === "ENOENT") {
                    try {
                        debug("create directory", publicationPath);
                        await fs.promises.mkdir(publicationPath, { recursive: false, mode: 0o644 });
                        continue;
                    } catch (e) {
                        debug(e);
                    }
                }
            }
            break;
        }
    }

    public async write(pubId: string, type: TFileType, data: string) {
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
        
        file.data = data;

        try {
            await fs.promises.writeFile(file.fileHandle, data, { encoding: "utf-8", flush: true });
        } catch (e) {
            debug(e);
        }
    }

    public async read(pubId: string, type: TFileType): Promise<string | undefined> {
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

        try {
            const data = await fs.promises.readFile(file.fileHandle, { encoding: "utf-8" });
            if (data === file.data) {
                return file.data;
            }
            file.data = data;
        } catch (e) {
            debug(e);
        }

        return file.data;
    }

    public async close(pubId: string) {
        if (this.lock) return ;

        debug(`${this.files.length} file(s) currently opened before closing ${pubId}`);

        const files = this.files.filter((a) => a.pubId === pubId);
        this.files = this.files.filter((a) => a.pubId !== pubId);

        debug(`${files.length} file(s) will be closed because attached to ${pubId}`);

        for (const file of files) {
            try {
                await file.fileHandle.close();
            } catch (e) {
                debug(e);
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
