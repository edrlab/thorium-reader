// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { dialog } from "electron";
import * as fs from "fs";
import { injectable } from "inversify";
import * as path from "path";
import { File } from "readium-desktop/common/models/file";
import { PublicationView } from "readium-desktop/common/views/publication";
import { ContentType } from "readium-desktop/utils/content-type";
import { getFileSize, rmDirSync } from "readium-desktop/utils/fs";
import slugify from "slugify";

import { PublicationParsePromise } from "@r2-shared-js/parser/publication-parser";
import { streamToBufferPromise } from "@r2-utils-js/_utils/stream/BufferUtils";
import { IZip } from "@r2-utils-js/_utils/zip/zip.d";

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
    ): Promise<File[]> {
        // Create a directory whose name is equals to publication identifier
        const pubDirPath = this.buildPublicationPath(identifier);
        fs.mkdirSync(pubDirPath);

        // Store publication file and extract its cover
        const bookFile = await this.storePublicationBook(
            identifier, srcPath);
        const coverFile = await this.storePublicationCover(
            identifier, srcPath);
        const files: File[] = [];
        files.push(bookFile);

        if (coverFile != null) {
            files.push(coverFile);
        }

        return files;
    }

    public removePublication(identifier: string) {
        rmDirSync(this.buildPublicationPath(identifier));
    }

    public getPublicationEpubPath(identifier: string): string {

        const root = this.buildPublicationPath(identifier);
        const pathEpub = path.join(
            root,
            `book.epub`,
        );
        if (fs.existsSync(pathEpub)) {
            return pathEpub;
        }
        return path.join(
            root,
            `book.audiobook`,
        );
    }

    public copyPublicationToPath(publicationView: PublicationView, destinationPath: string) {
        const publicationPath = this.getPublicationEpubPath(publicationView.identifier);
        const extension = path.extname(publicationPath);
        const newFilePath = `${destinationPath}/${slugify(publicationView.title)}${extension}`;
        fs.copyFile(publicationPath, newFilePath, (err) => {
            if (err) {
                dialog.showMessageBox({
                    type: "error",
                    message: err.message,
                    title: err.name,
                    buttons: ["OK"],
                });
            }
        });
    }

    private buildPublicationPath(identifier: string): string {
        return path.join(this.rootPath, identifier);
    }

    private async storePublicationBook(
        identifier: string,
        srcPath: string,
    ): Promise<File> {
        const extension = path.extname(srcPath);
        const isAudioBook = /\.audiobook$/.test(extension);
        const ext = isAudioBook ? "audiobook" : "epub";
        const filename = `book.${ext}`;
        const dstPath = path.join(
            this.buildPublicationPath(identifier),
            filename,
        );

        return new Promise<File>((resolve, _reject) => {
            const writeStream = fs.createWriteStream(dstPath);
            const fileResolve = () => {
                resolve({
                    url: `store://${identifier}/${filename}`,
                    ext,
                    contentType: isAudioBook ? ContentType.AudioBookPacked : ContentType.Epub,
                    size: getFileSize(dstPath),
                });
            };

            writeStream.on("finish", fileResolve);
            fs.createReadStream(srcPath).pipe(writeStream);
        });
    }

    // Extract the image cover buffer then create a file on the publication folder
    private async storePublicationCover(
        identifier: string,
        srcPath: string,
    ): Promise<File> {

        const r2Publication = await PublicationParsePromise(srcPath);

        // private Internal is very hacky! :(
        const zipInternal = (r2Publication as any).Internal.find((i: any) => {
            if (i.Name === "zip") {
                return true;
            }
            return false;
        });
        const zip = zipInternal.Value as IZip;

        const coverLink = r2Publication.GetCover();
        if (!coverLink) {
            // after PublicationParsePromise, cleanup zip handler
            r2Publication.freeDestroy();
            return null;
        }

        const coverType: string = coverLink.TypeLink;
        const zipStream = await zip.entryStreamPromise(coverLink.Href);
        const zipBuffer = await streamToBufferPromise(zipStream.stream);

        // after PublicationParsePromise, cleanup zip handler
        r2Publication.freeDestroy();

        // Remove start dot in extensoion
        const coverExt = path.extname(coverLink.Href).slice(1);
        const coverFilename = "cover." + coverExt;
        const coverDstPath = path.join(
            this.buildPublicationPath(identifier),
            coverFilename,
        );

        // Write cover to fs
        fs.writeFileSync(coverDstPath, zipBuffer);

        // Return cover file information
        return {
            url: `store://${identifier}/${coverFilename}`,
            ext: coverExt,
            contentType: coverType,
            size: getFileSize(coverDstPath),
        };
    }
}
