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

@injectable()
export class PublicationDirectory {
    public readonly defaultDirectory: string;
    public userDirectory?: string;

    public constructor(defaultDirectory: string) {
        this.defaultDirectory = defaultDirectory;
        this.readUserDirectory().catch(() => {
            // Ignore invalid or missing config.
        });
    }

    /**
     * Loads the persisted user directory in the background.
     * If the path is valid, it becomes the preferred storage directory.
     */
    private async readUserDirectory(): Promise<void> {
        try {
            const jsonStr = await fs.promises.readFile(userPublicationDirectoryConfigPath, "utf-8");
            const jsonObj = JSON.parse(jsonStr);
            const directoryPath = Array.isArray(jsonObj.directory)
                ? jsonObj.directory[0]
                : undefined;

            if (!directoryPath) {
                return;
            }

            if (!(await this.isDirectory(directoryPath))) {
                return;
            }

            this.userDirectory = directoryPath;
            debug("Set publication storage directory to", directoryPath);
        } catch (e) {
            debug(e);
        }
    }

    /**
     * Persists a new user directory if the provided path is a valid directory.
     */
    public async setUserDirectory(directoryPath: string): Promise<void> {
        if (!directoryPath) {
            this.userDirectory = undefined;
            await rmrf(userPublicationDirectoryConfigPath);
            return;
        }

        if (!(await this.isDirectory(directoryPath))) {
            return;
        }

        this.userDirectory = directoryPath;

        const jsonStr = JSON.stringify(
            { directory: [directoryPath] },
            null,
            4,
        );

        await fs.promises.writeFile(
            userPublicationDirectoryConfigPath,
            jsonStr,
            "utf-8",
        );
    }

    public async getDirectoryPath(): Promise<string> {
        const userDirectory = this.userDirectory;

        if (userDirectory && (await this.isDirectory(userDirectory))) {
            return userDirectory;
        }

        return this.defaultDirectory;
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
