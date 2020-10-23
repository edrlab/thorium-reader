// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { dialog } from "electron";
import * as fs from "fs";
import { injectable } from "inversify";
import * as path from "path";
import { acceptedExtension, acceptedExtensionObject } from "readium-desktop/common/extension";
import { File } from "readium-desktop/common/models/file";
import { PublicationView } from "readium-desktop/common/views/publication";
import { getFileSize } from "readium-desktop/utils/fs";
import { findMimeTypeWithExtension } from "readium-desktop/utils/mimeTypes";
import * as rimraf from "rimraf";
import slugify from "slugify";
import { pipeline } from "stream";
import { promisify } from "util";

import { Publication as R2Publication } from "@r2-shared-js/models/publication";

import { extractFileFromZip } from "../zip/extract";

// Logger
const debug = debug_("readium-desktop:main/publication-storage");
debug("_");

// Store pubs in a repository on filesystem
// Each file of publication is stored in a directory whose name is the
// publication uuid
// repository
// |- <publication 1 uuid>
//   |- epub file
//   |- cover file
// |- <publication 2 uuid>
@injectable()
export class PublicationStorage {
    private rootPath: string;

    public constructor(rootPath: string) {
        this.rootPath = rootPath;
    }

    public getRootPath() {
        return this.rootPath;
    }

    /**
     * Store a publication in a repository
     *
     * @param identifier Identifier of publication
     * @param srcPath Path of epub/audiobook to import
     * @return List of all stored files
     */
    public async storePublication(
        identifier: string,
        srcPath: string,
        r2Publication: R2Publication,
    ): Promise<File[]> {

        const fsp = fs.promises;

        const filePath = this.buildPublicationPath(identifier);

        try {

            await fsp.mkdir(filePath);
        } catch (e) {

            debug("ERROR storePublication can't create the folder", filePath);
        }

        const getCoverPromise = async () => {

            const coverLink = r2Publication?.GetCover();
            const coverPath = coverLink?.Href;
            if (coverPath) {
                return this.storePublicationCover(identifier, srcPath, filePath, coverPath);
            }
            return Promise.resolve<undefined>(undefined);
        };

        const settled = await Promise.allSettled([
            this.storePublicationBook(identifier, srcPath, filePath),
            getCoverPromise(),
        ]);

        const files = settled
            .map((settledResult) =>
                settledResult.status === "fulfilled"
                    ? settledResult.value
                    : undefined,
            ).filter((v) => !!v);

        settled.forEach((settledResult, i) => {
            if (settledResult.status === "rejected") {
                debug(`storePublication promise rejected ${i} reason:${settledResult.reason}`);
            }
        });

        return files;
    }

    public async removePublication(identifier: string) {

        if (identifier) {
            const filePath = this.buildPublicationPath(identifier);

            const rimrafPromise = promisify(rimraf);
            await rimrafPromise(filePath); // no error catched, handled by saga
        }
    }

    public async getPublicationEpubPath(identifier: string): Promise<string> {

        if (identifier) {

            const fsp = fs.promises;

            const root = this.buildPublicationPath(identifier);

            const dir = await fsp.opendir(root);
            try {

                // https://github.com/palantir/tslint/issues/3997
                // tslint:disable-next-line: await-promise
                for await (const dirent of dir) {

                    if (dirent?.isFile() && dirent.name) {
                        const ext = path.extname(dirent.name);
                        if (acceptedExtension(ext)) {
                            return path.join(
                                root,
                                dirent.name,
                            );
                        }
                    }
                }
            } finally {

                await dir.close();
            }

        }

        throw new Error(`getPublicationEpubPath() FAIL ${identifier} (cannot find book.epub|audiobook|etc.)`);

    }

    public async copyPublicationToPath(publicationView: PublicationView, destinationPath: string) {

        const publicationPath = await this.getPublicationEpubPath(publicationView.identifier);

        const extension = path.extname(publicationPath);
        const newFilePath = `${destinationPath}/${slugify(publicationView.title)}${extension}`;

        const fsp = fs.promises;

        try {

            await fsp.copyFile(publicationPath, newFilePath);

        } catch (err) {

            debug("ERROR copyPublication to external dir", err);
            await dialog.showMessageBox({
                type: "error",
                message: err?.message || "",
                title: err?.name || "copyPublicationPath",
                buttons: ["OK"],
            });
        }
    }

    private buildPublicationPath(identifier: string): string {
        return path.join(this.rootPath, identifier);
    }

    private async storePublicationBook(
        identifier: string,
        srcPath: string,
        appPath: string,
    ): Promise<File | undefined> {

        if (identifier && srcPath) {

            const ext = path.extname(srcPath);
            const extFallback = acceptedExtension(ext) ? ext : acceptedExtensionObject.epub; // epub by default

            const filename = `book${extFallback}`;
            const dstPath = path.join(
                appPath,
                filename,
            );

            const fsp = fs.promises;
            try {

                await fsp.copyFile(srcPath, dstPath);

                return {
                    url: `store://${identifier}/${filename}`,
                    ext: extFallback,
                    contentType: findMimeTypeWithExtension(extFallback),
                };
            } catch (e) {

                debug("ERROR store publcation book copy file", e);
            }

        }

        return undefined;
    }

    // Extract the image cover buffer then create a file on the publication folder
    private async storePublicationCover(
        identifier: string,
        srcPath: string,
        appPath: string,
        coverInternalPath: string,
    ): Promise<File | undefined> {

        if (srcPath && coverInternalPath) {

            const coverStream = await extractFileFromZip(srcPath, coverInternalPath);
            if (coverStream) {

                const coverExt = path.extname(coverInternalPath);
                const coverFilename = `cover${coverExt}`;
                const coverDstPath = path.join(
                    appPath,
                    coverFilename,
                );

                const dstStream = fs.createWriteStream(coverDstPath);

                const pipelinePromise = promisify(pipeline);
                await pipelinePromise(coverStream, dstStream);

                return {
                    url: `store://${identifier}/${coverFilename}`,
                    ext: coverExt,
                    contentType: findMimeTypeWithExtension(coverExt),
                    size: await getFileSize(coverDstPath) || 0,
                };
            }

        }

        return undefined;
    }
}
