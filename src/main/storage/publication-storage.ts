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
import { acceptedExtensionObject, publicationExtensionStoredOnDisk } from "readium-desktop/common/extension";
import { File } from "readium-desktop/common/models/file";
import { PublicationView } from "readium-desktop/common/views/publication";
import { ContentType } from "readium-desktop/utils/contentType";
import { getFileSize, rmrf } from "readium-desktop/utils/fs";

import { PublicationParsePromise } from "@r2-shared-js/parser/publication-parser";
import { streamToBufferPromise } from "@r2-utils-js/_utils/stream/BufferUtils";
import { IZip } from "@r2-utils-js/_utils/zip/zip";
import debug_ from "debug";
import { sanitizeForFilename } from "readium-desktop/common/safe-filename";
import { URL_PROTOCOL_STORE } from "readium-desktop/common/streamerProtocol";
import { IReaderStateReaderPersistence } from "readium-desktop/common/redux/states/renderer/readerRootState";

const debug = debug_("readium-desktop:main/storage/pub-storage");

export type TFileTypePubStorage = Extract<keyof IReaderStateReaderPersistence, "locator" | "config" | "disableRTLFlip" | "divina" | "allowCustomConfig" | "noteTotalCount" | "pdfConfig">;
// "bound" is not included, saved only in publication-data

const isUUIDv4 = (uuid: string) => /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(uuid);
const assertUUIDv4 = (uuid: string) => {
    if (!isUUIDv4(uuid)) {
        throw new Error("not an uuidv4 identifier !");
    }
};

const jsonStringify = (d: any) => (__TH__IS_DEV__ || __TH__IS_CI__) ? JSON.stringify(d, null, 4) : JSON.stringify(d);

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

    /**
     * from di.ts
     * %appData%\config-data-json{-dev}\
     */
    // private configDataFolderPath: string;

    /**
     * appData/userData default publication storage directory path
     * aka: %appData%\publications{-dev}\<uuid>
     */
    private defaultVaultPath: string;

    /**
     * publication storage directory path choose by user
     */
    private userVaultPath: Promise<string>;

    /**
     * json config path of the user choosen vault
     */
    private userVaultConfigPath: string;

    private assertAndGetFileName = (type: TFileTypePubStorage) => {
        const fileName = type === "locator" ? "locator.json" : type === "config" ? "config.json" : type === "disableRTLFlip" ? "disableRTLFlip.json" : type === "divina" ? "divina.json" : type === "allowCustomConfig" ? "allowCustomConfig.json" : type === "noteTotalCount" ? "noteTotalCount.json" : type === "pdfConfig" ? "pdfConfig.json" : "";
        if (!fileName) {
            throw new Error("fileType not found");
        }
        return fileName;
    };

    public constructor(rootPath: string, userVaultConfigPath: string) {
        this.userVaultConfigPath = userVaultConfigPath;
        this.defaultVaultPath = rootPath;
        this.userVaultPath = this.readUserVault().then((userVaultPath) => {
            debug("USER_VAULT_PATH=", userVaultPath);
            return userVaultPath;
        }).catch((e: any): undefined => {
            debug(`${e}`);
            return undefined;
        }); // promise not resolved
    }

    private async readUserVault(): Promise<string> {
        let userVaultPath = "";
        try {
            const jsonStr = await fs.promises.readFile(this.userVaultConfigPath, { encoding: "utf-8" });
            const jsonObj = JSON.parse(jsonStr);
            userVaultPath = Array.isArray(jsonObj.vault) ? jsonObj.vault[0] : "";
        } catch {
            // ignore
        }

        if (!userVaultPath) {
            return undefined;
        }
        try {
            // fs.promises.access(userVaultPath, fs.constants.W_OK | fs.constants.R_OK);
            const dirStat = await fs.promises.stat(userVaultPath);
            if (!dirStat.isDirectory()) {
                throw new Error(`Directory: (${userVaultPath}) not created`);
            }
        } catch {
            return undefined;
        }

        debug("Set publication storage vault to", userVaultPath);

        return userVaultPath;
    }

    public async setUserVault(directoryPath: string) {

        if (!directoryPath) {
            return ;
        }

        try {
            // fs.promises.access(directoryPath, fs.constants.W_OK | fs.constants.R_OK);
            const dirStat = await fs.promises.stat(directoryPath);
            if (!dirStat.isDirectory()) {
                throw new Error(`Directory: (${directoryPath}) not created`);
            }
        } catch {
            return;
        }

        const jsonObj = { vault: [directoryPath] };
        const jsonStr = JSON.stringify(jsonObj, null, 4);
        await fs.promises.writeFile(this.userVaultConfigPath, jsonStr, { encoding: "utf-8" });
    }

    // private only
    // public getRootPath() {
    //     return this.defaultRootPath;
    // }
    public async getVaultPath() {
        return (await this.userVaultPath) || this.defaultVaultPath;
    }

    public async writeJsonObj(
        identifier: string,
        type: TFileTypePubStorage,
        jsonObj: object,
    ) {
        assertUUIDv4(identifier);

        const fileName = this.assertAndGetFileName(type);

        const pubPath = await this.findPublicationPath(identifier);
        const filePath = path.join(pubPath, fileName);

        try {
            const jsonStrExisting_ = await fs.promises.readFile(filePath, { encoding: "utf-8" });
            const jsonStrExisting = JSON.stringify(JSON.parse(jsonStrExisting_));
            const jsonStr = JSON.stringify(jsonObj);
            if (jsonStrExisting === jsonStr) {
                debug("JSONObj Storage same as JSONObj Serialized, already persisted");
                return;
            }
        } catch {
            // ignore
        }

        await using dir = await fs.promises.mkdtempDisposable(pubPath); // same as defer and RAII: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/await_using
        const tmpFilePath = path.join(dir.path, "locator.json");
        const jsonStr = jsonStringify(jsonObj);
        await fs.promises.writeFile(tmpFilePath, jsonStr, { encoding: "utf-8", flush: true});
        const jsonStrCheck = await fs.promises.readFile(tmpFilePath, { encoding: "utf-8" });
        if (jsonStrCheck === jsonStr) {
            await fs.promises.rename(tmpFilePath, filePath);
            debug("JSONObj written to", filePath);
        } else {
            debug("JSONObj diff, NOT written to", filePath, " --- ", jsonStrCheck, " !== ", jsonStr);
        }
    }

    public async readJsonObj(
        identifier: string,
        type: TFileTypePubStorage,
    ): Promise<object | undefined> {

        assertUUIDv4(identifier);

        const fileName = this.assertAndGetFileName(type);

        const pubPath = await this.findPublicationPath(identifier);
        const filePath = path.join(pubPath, fileName);

        try {
            const jsonStr = await fs.promises.readFile(filePath, { encoding: "utf-8" });
            try {
                const jsonObj = JSON.parse(jsonStr);
                return jsonObj;
            } catch (e) {
                debug(e);
            }
        } catch (e) {
            debug(e);
        }

        return undefined;
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

        assertUUIDv4(identifier);

        // Create a directory whose name is equals to publication identifier
        const pubDirPath = path.join(await this.getVaultPath(), identifier);

        try {
            await fs.promises.mkdir(pubDirPath);
        } catch (e: any) {
            debug(`mkdir ${pubDirPath}: ${e}`);
            if (e.code === "EEXIST") {
                debug("Directory already exists");
                debug("How to handle this error?");
                debug("Do we have to clean the directory before using it?");
                debug("For the moment let's remove the directory");
                try {
                    await rmrf(pubDirPath);
                    await fs.promises.mkdir(pubDirPath);
                } catch (e) {
                    debug(e);
                }
            }
        }

        const dirStat = await fs.promises.stat(pubDirPath);
        if (!dirStat.isDirectory()) {
            throw new Error(`Directory: (${pubDirPath}) not created`);
        }

        const files: File[] = [];

        const bookFile = await this.storePublicationBook(
            identifier, srcPath, pubDirPath);
        files.push(bookFile);

        const coverFile = await this.storePublicationCover(
            identifier, srcPath, pubDirPath);
        if (coverFile) {
            files.push(coverFile);
        }

        return files;
    }

    private __publicationEpubPathMap = new Map<string, string>();
    public async removePublication(identifier: string /*, preservePublicationOnFileSystem?: string*/) {

        assertUUIDv4(identifier);

        if (this.__publicationEpubPathMap.has(identifier)) {
            this.__publicationEpubPathMap.delete(identifier);
        }


        // try {
        // if (preservePublicationOnFileSystem) {
        //     const log = path.join(p, "error.txt");
        //     fs.writeFileSync(log, preservePublicationOnFileSystem, { encoding: "utf-8" });
        //     shell.showItemInFolder(log);

        //     // const parent = path.dirname(p) + "_REMOVED";
        //     // if (!fs.existsSync(parent)) {
        //     //     fs.mkdirSync(parent);
        //     // }

        //     // setTimeout(async () => {
        //     //     await shell.openPath(parent);
        //     // }, 0);
        //     // shell.showItemInFolder(parent);

        //     // const f = path.basename(p);
        //     // const n = path.join(parent, f);
        //     // shell.showItemInFolder(n);

        //     return;
        // }
        // } catch (e) {
        //     debug(e);
        //     // debug(preservePublicationOnFileSystem);
        //     debug(`removePublication error (ignore) ${identifier} ${p}`);
        // }

        const p = await this.findPublicationPath(identifier);
        const userVaultPath = await this.userVaultPath; // can be undefined;
        const p1 = userVaultPath ? path.join(userVaultPath, identifier) : undefined;
        const p2 = path.join(this.defaultVaultPath, identifier);
        try {
            if (p1) {
                await rmrf(p1);
            }
        } catch (e) {
            debug(p1 === p ? e : "ok");
        }
        try {
            await rmrf(p2);
        } catch (e) {
            debug(p2 === p ? e : "ok");
        }

    }

    public async getPublicationEpubPath(identifier: string): Promise<string> {

        assertUUIDv4(identifier);

        // TODO: if map.get() is as expensive as map.has() then simply: const val = map.get(key); if (!!val) return val;
        if (this.__publicationEpubPathMap.has(identifier)) {
            return this.__publicationEpubPathMap.get(identifier);
        }

        // path.join(this.rootPath, identifier);
        const root = await this.findPublicationPath(identifier);

        try {
            const files = await fs.promises.readdir(root, {withFileTypes: true});
            debug("getPublicationEpubPath: readdir", root);
            for (const file of files) {
                if (!file.isFile()) {
                    continue;
                }
                debug(`${file.name} from ${file.parentPath}`);
                const ext = path.extname(file.name);
                if (publicationExtensionStoredOnDisk.includes(ext)) {
                    const filePath = path.join(file.parentPath, file.name);
                    const stats = await fs.promises.stat(filePath);
                    if (stats.isFile() && stats.size > 10) {
                        this.__publicationEpubPathMap.set(identifier, filePath);
                        return filePath;
                    }
                    // await fs.promises.access(filePath, fs.constants.R_OK | fs.constants.W_OK);
                }
            }
        } catch (err) {
            debug("readdir error", err);
        }

        debug("Error GetPublicationEpubPath not found with", identifier, "Throw new Error");
        throw new Error(`getPublicationEpubPath() FAIL ${identifier} (cannot find book.epub|audiobook|etc.)`);
    }

    public async getPublicationFilename(publicationView: PublicationView) {
        const publicationPath = await this.getPublicationEpubPath(publicationView.identifier);
        const extension = path.extname(publicationPath);
        const filename = sanitizeForFilename(publicationView.documentTitle + extension);
        return filename;
    }

    public async copyPublicationToPath(publicationView: PublicationView, filePath: string) {
        if (!filePath) {
            throw new Error("no filePath !");
        }
        const publicationPath = await this.getPublicationEpubPath(publicationView.identifier);
        fs.copyFile(publicationPath, filePath, async (err) => {
            if (err) {
                await dialog.showMessageBox({
                    type: "error",
                    message: err.message,
                    title: err.name,
                    buttons: ["OK"],
                });
            }
        });
    }

    public async findPublicationPath(identifier: string): Promise<string> {

        assertUUIDv4(identifier);

        debug("FindPublicationPath", identifier);

        const defer = (pubPath: string) => {
            if (this.__publicationEpubPathMap.has(identifier)) {
                if (path.dirname(this.__publicationEpubPathMap.get(identifier)) !== pubPath) {
                    debug("publicationEpubPath cache invalidation for", identifier);
                    this.__publicationEpubPathMap.delete(identifier);
                }
            }
        };

        let publicationPath = "";

        const userVaultPath = await this.userVaultPath; // can be undefined
        if (userVaultPath) {

            publicationPath = path.join(userVaultPath, identifier);

            try {
                // await fs.promises.access(publicationPath, fs.constants.R_OK | fs.constants.W_OK);
                const stats = await fs.promises.stat(publicationPath);
                if (stats.isDirectory()) {
                    defer(publicationPath);
                    return publicationPath;
                }
            } catch (e) {
                debug(e);
                // ignore
            }
        }

        publicationPath = path.join(this.defaultVaultPath, identifier);
        try {
            // await fs.promises.access(publicationPath, fs.constants.R_OK | fs.constants.W_OK);
            const stats = await fs.promises.stat(publicationPath);
            if (stats.isDirectory()) {
                defer(publicationPath);
                return publicationPath;
            }
        } catch (e) {
            debug(e);
            // ignore
        }
        throw new Error("publication folder path not found");
    }

    private _loopOnDirectory = async (dir: string, pubs: Set<string>) => {
        const files = await fs.promises.readdir(dir, { withFileTypes: true });

        for (const file of files) {
            if (
                isUUIDv4(file.name) &&
                file.isDirectory()
            ) {
                pubs.add(file.name);
            }
        }
    };
    public async listPublicationIdPath(): Promise<string[]> {

        const pubIdSet = new Set<string>();

        const userVaultPath = await this.userVaultPath; // can be undefined
        if (userVaultPath) {
            await this._loopOnDirectory(userVaultPath, pubIdSet);
        }
        await this._loopOnDirectory(this.defaultVaultPath, pubIdSet);
        return [...pubIdSet.values()];
    }

    public async checkPublicationsIntegrity(): Promise<{ good: string[], bad: string[] }> {

        const pubsId = await this.listPublicationIdPath();

        const good: string[] = [];
        const bad: string[] = [];
        for (const pubId of pubsId) {
            try {
                if (await this.getPublicationEpubPath(pubId)) {
                    good.push(pubId);
                    continue;
                }
            } catch {
                // ignore
            }
            bad.push(pubId);
        }

        return {
            good,
            bad,
        };

    }

    private async storePublicationBook(
        identifier: string,
        srcPath: string,
        dstPath: string,
    ): Promise<File> {

        const extension = path.extname(srcPath);
        const isAudioBook = new RegExp(`\\${acceptedExtensionObject.audiobook}$`, "i").test(extension);
        const isAudioBookLcp = new RegExp(`\\${acceptedExtensionObject.audiobookLcp}$`, "i").test(extension);
        const isAudioBookLcpAlt = new RegExp(`\\${acceptedExtensionObject.audiobookLcpAlt}$`, "i").test(extension);
        const isWebpub = new RegExp(`\\${acceptedExtensionObject.webpub}$`, "i").test(extension);
        const isDivina = new RegExp(`\\${acceptedExtensionObject.divina}$`, "i").test(extension);
        const isLcpPdf = new RegExp(`\\${acceptedExtensionObject.pdfLcp}$`, "i").test(extension);
        const isDaisy = new RegExp(`\\${acceptedExtensionObject.daisy}$`, "i").test(extension);

        const ext = isAudioBook
            ? acceptedExtensionObject.audiobook
            : (
                isAudioBookLcp
                    ? acceptedExtensionObject.audiobookLcp
                    : (
                        isAudioBookLcpAlt
                            ? acceptedExtensionObject.audiobookLcpAlt
                            : (
                                isDivina
                                    ? acceptedExtensionObject.divina
                                    : (
                                        isWebpub
                                            ? acceptedExtensionObject.webpub
                                            : (
                                                isLcpPdf
                                                    ? acceptedExtensionObject.pdfLcp
                                                    : (
                                                        isDaisy
                                                            ? acceptedExtensionObject.daisy
                                                            : acceptedExtensionObject.epub // includes .epub3 and .pnld
                                                    )
                                            )
                                    )
                            )
                    )
            );

        const filename = `book${ext}`;
        const bookDstPath = path.join(
            dstPath,
            filename,
        );

        return new Promise<File>((resolve, _reject) => {
            const writeStream = fs.createWriteStream(bookDstPath);
            const fileResolve = () => {
                resolve({
                    url: `${URL_PROTOCOL_STORE}://${identifier}/${filename}`,
                    ext,
                    contentType:
                        isAudioBook
                            ? ContentType.AudioBookPacked
                            : (
                                (isAudioBookLcp || isAudioBookLcpAlt)
                                    ? ContentType.AudioBookPackedLcp
                                    : isDivina
                                        ? ContentType.DivinaPacked
                                        : isWebpub
                                            ? ContentType.webpubPacked
                                            : isLcpPdf
                                                ? ContentType.lcppdf
                                                : ContentType.Epub
                            ),
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
        dstPath: string,
    ): Promise<File> {

        let r2Publication;
        try {
            r2Publication = await PublicationParsePromise(srcPath);
        } catch (err) {
            console.log(err);
            return null;
        }

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
            dstPath,
            coverFilename,
        );

        // Write cover to fs
        fs.writeFileSync(coverDstPath, zipBuffer);

        // Return cover file information
        return {
            url: `${URL_PROTOCOL_STORE}://${identifier}/${coverFilename}`,
            ext: coverExt,
            contentType: coverType,
            size: getFileSize(coverDstPath),
        };
    }
}
