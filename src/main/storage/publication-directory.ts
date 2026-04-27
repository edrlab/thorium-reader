// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as fs from "fs";
import { injectable } from "inversify";
import debug_ from "debug";
import { userPublicationDirectoryConfigPath } from "../di";
import { rmrf } from "readium-desktop/utils/fs";

const debug = debug_("readium-desktop:main/storage/publication-directory");

type UserDirectoryConfig = {
    directory: [string, ...string[]];
};

function isUserDirectoryConfig(value: unknown): value is UserDirectoryConfig {
    if (!value || typeof value !== "object") {
        return false;
    }

    const directory = (value as { directory?: unknown }).directory;
    return Array.isArray(directory)
        && typeof directory[0] === "string"
        && directory[0].length > 0;
}

@injectable()
export class PublicationDirectory {
    public readonly defaultDirectory: string;
    public userDirectory?: string;
    private readonly readyPromise: Promise<void>;

    public constructor(defaultDirectory: string) {
        this.defaultDirectory = defaultDirectory;
        // Best-effort async initialization: startup must keep working with the
        // default directory even if the persisted user directory is missing or invalid.
        this.readyPromise = this.readUserDirectory();
    }

    // Load the persisted directory in the background and keep it only if it still exists.
    private async readUserDirectory(): Promise<void> {
        try {
            const jsonStr = await fs.promises.readFile(userPublicationDirectoryConfigPath, "utf-8");
            const json = JSON.parse(jsonStr) as unknown;
            if (!isUserDirectoryConfig(json)) {
                return;
            }
            const directoryPath = json.directory[0];
            const isDirectory = await this.isDirectory(directoryPath);
            if (!isDirectory) {
                return;
            }
            this.userDirectory = directoryPath;
            debug("Set publication storage directory to", directoryPath);
        } catch (e) {
            debug(e);
        }
    }

    public async ready(): Promise<void> {
        await this.readyPromise;
    }

    public async setUserDirectory(directoryPath: string): Promise<void> {
        await this.ready();

        if (!directoryPath) {
            this.userDirectory = undefined;
            await rmrf(userPublicationDirectoryConfigPath);
            return;
        }

        const isDirectory = await this.isDirectory(directoryPath);
        if (!isDirectory) {
            return;
        }
        this.userDirectory = directoryPath;
        const jsonStr = JSON.stringify({ directory: [directoryPath] }, null, 4);
        await fs.promises.writeFile(userPublicationDirectoryConfigPath, jsonStr, "utf-8");
    }

    public async getDirectoryPath(): Promise<string> {
        await this.ready();

        const userDirectory = this.userDirectory;

        if (!userDirectory) {
            return this.defaultDirectory;
        }
        const isDirectory = await this.isDirectory(userDirectory);
        return isDirectory ? userDirectory : this.defaultDirectory;
    }

    private async isDirectory(path: string): Promise<boolean> {
        try {
            const stat = await fs.promises.stat(path);
            return stat.isDirectory();
        } catch {
            return false;
        }
    }
}
