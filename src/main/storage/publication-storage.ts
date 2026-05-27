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
import { acceptedExtensionObject, getExtensionWithoutDot, isAcceptedExtension, normalizeExtension } from "readium-desktop/common/extension";
import { File } from "readium-desktop/common/models/file";
import { PublicationView } from "readium-desktop/common/views/publication";
import { getCanonicalUUIDv4FileNameFromFs, getFilePathNormalize, getFileSize, rmrf } from "readium-desktop/utils/fs";
import { findExtWithMimeType, findMimeTypeWithExtension, mimeTypes } from "readium-desktop/utils/mimeTypes";

import { PublicationParsePromise } from "@r2-shared-js/parser/publication-parser";
import { streamToBufferPromise } from "@r2-utils-js/_utils/stream/BufferUtils";
import { IZip } from "@r2-utils-js/_utils/zip/zip";
import debug_ from "debug";
import { sanitizeForFilename } from "readium-desktop/common/safe-filename";
import { URL_PROTOCOL_STORE } from "readium-desktop/common/streamerProtocol";
import { IReaderStateReaderPersistence } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { userPublicationDirectoryConfigPath } from "../di";
import { PublicationDocument } from "../db/document/publication";
import { computeFileHash, extractCrc32OnZip } from "../tools/crc";
import { assertUUIDv4 } from "readium-desktop/utils/uuid";

const debug = debug_("readium-desktop:main/storage/pub-storage");

export type TFileTypePubStorage = Extract<keyof IReaderStateReaderPersistence, "locator" | "config" | "disableRTLFlip" | "divina" | "allowCustomConfig" | "noteTotalCount" | "pdfConfig">;
// "bound" is not included, saved only in publication-data

interface IPublicationStoragePathEntry {
    identifier: string;
    directoryPath: string;
}

interface IPublicationStorageLocationCacheEntry {
    directoryPath?: string;
    epubPath?: string;
    publicationDirectoriesRevision: number;
}

interface IPublicationStorageDirectoryCacheSnapshot {
    directories: string[];
    revision: number;
}

type UserDirectoryConfig = {
    directory: [string, ...string[]];
};

export type TPublicationStorageIntegrityIssueType =
    "duplicate-directory"
    | "duplicate-database-hash"
    | "disk-hash-already-in-database"
    | "missing-directory"
    | "missing-archive"
    | "missing-document-file"
    | "invalid-document-file-url";

export interface IPublicationStorageIntegrityIssue {
    type: TPublicationStorageIntegrityIssueType;
    identifier: string;
    message: string;
    directoryPath?: string[];
    filePath?: string;
    fileUrl?: string;
    hash?: string;
    matchingIdentifier?: string[];
}

export interface IPublicationStorageIntegrityResult {
    good: string[];
    bad: string[];
    issues: IPublicationStorageIntegrityIssue[];
}

export interface IPublicationStorageRecoverablePublication {
    identifier: string;
    filePath: string;
}

const toFilePathArray = (filePath: string | undefined): string[] | undefined => filePath ? [filePath] : undefined;

const jsonStringify = (d: any) => (__TH__IS_DEV__ || __TH__IS_CI__) ? JSON.stringify(d, null, 4) : JSON.stringify(d);

function isUserDirectoryConfig(value: unknown): value is UserDirectoryConfig {
    if (!value || typeof value !== "object") {
        return false;
    }

    const directory = (value as { directory?: unknown }).directory;
    return Array.isArray(directory)
        && typeof directory[0] === "string"
        && directory[0].length > 0;
}

const getStoredPublicationFileMimeTypeFromExtension = (ext: string): string => {
    const normalizedExt = normalizeExtension(ext);
    if (normalizedExt === acceptedExtensionObject.daisy) {
        return mimeTypes["zip"];
    }
    return findMimeTypeWithExtension(normalizedExt) || "";
};

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
    private readonly _defaultDirectory: string;
    private _userDirectory?: string;

    private readonly readyPromise: Promise<void>;

    // Publication directory/archive lookup is repeated on hot paths such as
    // streamer requests. The cache avoids expensive filesystem calls by storing,
    // per identifier, the resolved publication directory and archive path.
    //
    // A publication may exist in the default directory, in the optional user
    // directory, or move between them after storage settings change.
    //
    // Instead of comparing directory arrays (or strings) on every cache read,
    // each cache entry is tagged with the current revision. Changing userDirectory
    // increments that revision, so stale entries are detected and dropped during
    // lookup. This turns string comparison into cheap numeric comparison.
    //
    // Import/remove operations invalidate the affected lookup cache entry
    // immediately.
    private publicationDirectoriesRevision = 0;
    private publicationLocationCache = new Map<string, IPublicationStorageLocationCacheEntry>();
    private getPublicationPathCallCountByIdentifier = new Map<string, number>();
    private getPublicationEpubPathCallCountByIdentifier = new Map<string, number>();

    public constructor(defaultDirectory: string) {
        this._defaultDirectory = defaultDirectory;
        // Best-effort async initialization: startup must keep working with the
        // default directory even if the persisted user directory is missing or invalid.
        this.readyPromise = this.readUserDirectory();
    }

    public get defaultDirectory(): string {
        return this._defaultDirectory;
    }

    public get userDirectory(): string | undefined {
        return this._userDirectory;
    }

    public getStorablePublicationExtension(ext: string): string {
        const normalizedExt = normalizeExtension(ext);
        switch (normalizedExt) {
            case acceptedExtensionObject.audiobook:
            case acceptedExtensionObject.audiobookLcp:
            case acceptedExtensionObject.audiobookLcpAlt:
            case acceptedExtensionObject.divina:
            case acceptedExtensionObject.webpub:
            case acceptedExtensionObject.pdfLcp:
            case acceptedExtensionObject.daisy:
                return normalizedExt;
            default:
                return acceptedExtensionObject.epub; // includes .epub3 and .pnld
        }
    }

    public isStorablePublicationExtension(ext: string): boolean {
        switch (normalizeExtension(ext)) {
            case acceptedExtensionObject.epub:
            case acceptedExtensionObject.audiobook:
            case acceptedExtensionObject.audiobookLcp:
            case acceptedExtensionObject.audiobookLcpAlt:
            case acceptedExtensionObject.divina:
            case acceptedExtensionObject.webpub:
            case acceptedExtensionObject.pdfLcp:
            case acceptedExtensionObject.daisy:
                return true;
            default:
                return false;
        }
    }

    // Storage directory configuration

    public async ready(): Promise<void> {
        await this.readyPromise;
    }

    public async setUserDirectory(directoryPath: string): Promise<void> {
        await this.ready();

        if (!directoryPath) {
            this.setUserDirectoryPath(undefined);
            await rmrf(userPublicationDirectoryConfigPath);
            return;
        }

        const isDirectory = await this.isDirectory(directoryPath);
        if (!isDirectory) {
            return;
        }
        this.setUserDirectoryPath(directoryPath);
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

    public async getPublicationDirectories(): Promise<string[]> {
        await this.ready();

        return this.getPublicationDirectoriesFromCurrentState();
    }

    private getPublicationDirectoriesFromCurrentState(): string[] {
        const directories = [
            this.defaultDirectory,
        ];
        if (
            this.userDirectory
            && getFilePathNormalize(this.userDirectory) !== getFilePathNormalize(this.defaultDirectory)
        ) {
            directories.push(this.userDirectory);
        }

        return directories;
    }

    private getPublicationDirectoriesRevision(): number {
        return this.publicationDirectoriesRevision;
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
            this.setUserDirectoryPath(directoryPath);
            debug("Set publication storage directory to", directoryPath);
        } catch (e) {
            debug(e);
        }
    }

    private setUserDirectoryPath(directoryPath: string | undefined): void {
        const currentDirectory = this.userDirectory ? getFilePathNormalize(this.userDirectory) : undefined;
        const nextDirectory = directoryPath ? getFilePathNormalize(directoryPath) : undefined;
        // Same normalized path can still update display/persisted casing without invalidating lookups.
        if (currentDirectory !== nextDirectory) {
            this.incrementPublicationDirectoriesRevision();
        }
        this._userDirectory = directoryPath;
    }

    private incrementPublicationDirectoriesRevision(): void {
        this.publicationDirectoriesRevision++;
    }

    private async isDirectory(path_: string): Promise<boolean> {
        try {
            const stat = await fs.promises.stat(path_);
            return stat.isDirectory();
        } catch {
            return false;
        }
    }

    // Reader-state JSON files

    private assertAndGetFileName(type: TFileTypePubStorage) {
        const fileName = type === "locator" ? "locator.json" : type === "config" ? "config.json" : type === "disableRTLFlip" ? "disableRTLFlip.json" : type === "divina" ? "divina.json" : type === "allowCustomConfig" ? "allowCustomConfig.json" : type === "noteTotalCount" ? "noteTotalCount.json" : type === "pdfConfig" ? "pdfConfig.json" : "";
        if (!fileName) {
            throw new Error("fileType not found");
        }
        return fileName;
    }

    public async writeJsonObj(
        identifier: string,
        type: TFileTypePubStorage,
        jsonObj: object,
    ) {
        assertUUIDv4(identifier);

        const fileName = this.assertAndGetFileName(type);

        const pubPath = await this.getPublicationPath(identifier);
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

        const pubPath = await this.getPublicationPath(identifier);
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

    // Publication lifecycle

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

        const directoryPath = await this.getDirectoryPath();
        const defaultDirectoryPath = this.defaultDirectory;
        // New imports should use the user directory when available.
        const publicationDirectoryPath = path.join(directoryPath, identifier);
        debug(`storePublication in directory ${publicationDirectoryPath}`);

        try {
            return await this.storePublicationInDirectory(identifier, srcPath, publicationDirectoryPath);
        } catch (e) {
            if (directoryPath === defaultDirectoryPath) {
                throw e;
            }
            // If writing to the configured external directory fails, retry in default storage.
            debug(`storePublication failed in configured directory ${publicationDirectoryPath}, retry in default directory`, e);
            try {
                await rmrf(publicationDirectoryPath);
            } catch (err) {
                debug("storePublication cleanup before retry failed", err);
            }
            const defaultPublicationDirectoryPath = path.join(defaultDirectoryPath, identifier);
            debug(`storePublication fallback to default directory ${defaultPublicationDirectoryPath} for ${identifier}`);
            return this.storePublicationInDirectory(
                identifier,
                srcPath,
                defaultPublicationDirectoryPath,
            );
        }
    }

    private async storePublicationInDirectory(
        identifier: string,
        srcPath: string,
        publicationDirectoryPath: string,
    ): Promise<File[]> {
        debug(`storePublication write into ${publicationDirectoryPath} for ${identifier}`);

        this.invalidatePublicationLocationCache(identifier);

        try {
            await fs.promises.mkdir(publicationDirectoryPath);
        } catch (e: any) {
            debug(`mkdir ${publicationDirectoryPath}: ${e}`);
            if (e.code === "EEXIST") {
                debug("Directory already exists");
                debug("How to handle this error?");
                debug("Do we have to clean the directory before using it?");
                debug("For the moment let's remove the directory");
                try {
                    await rmrf(publicationDirectoryPath);
                    await fs.promises.mkdir(publicationDirectoryPath);
                } catch (err) {
                    debug(err);
                }
            }
        }

        const dirStat = await fs.promises.stat(publicationDirectoryPath);
        if (!dirStat.isDirectory()) {
            throw new Error(`Directory: (${publicationDirectoryPath}) not created`);
        }

        const files: File[] = [];

        const bookFile = await this.storePublicationBook(
            identifier, srcPath, publicationDirectoryPath);
        files.push(bookFile);

        try {
            const coverFile = await this.storePublicationCover(
                identifier, srcPath, publicationDirectoryPath);
            if (coverFile) {
                files.push(coverFile);
            }
        } catch (e) {
            debug(e);
        }

        return files;
    }

    public async removePublication(identifier: string /*, preservePublicationOnFileSystem?: string*/) {

        assertUUIDv4(identifier);

        this.invalidatePublicationLocationCache(identifier);


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

        await this.ready();

        let removedAtLeastOne = false;
        let accessError: Error | undefined;

        // Safe cleanup: once the publication has been removed, failed publication access to another directory
        for (const directoryPath of this.getPublicationDirectoriesFromCurrentState()) {
            const publicationPath = path.join(directoryPath, identifier);

            try {
                await fs.promises.stat(publicationPath);
            } catch (e: any) {
                if (e?.code !== "ENOENT") {
                    accessError = new Error(`Failed to access publication storage at ${publicationPath}: ${e?.message || e}`);
                }
                continue;
            }

            try {
                await rmrf(publicationPath);
                removedAtLeastOne = true;
            } catch (e: any) {
                throw new Error(`Failed to remove publication storage at ${publicationPath}: ${e?.message || e}`);
            }
        }

        if (!removedAtLeastOne && accessError) {
            throw accessError;
        }

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
        try {
            await fs.promises.copyFile(publicationPath, filePath /*, constants.COPYFILE_EXCL */);
        } catch (err: any) {

            // TODO: Toast!? i18n!?
            await dialog.showMessageBox({
                type: "error",
                message: err?.message,
                title: err?.name,
                buttons: ["OK"],
            });
        }
    }

    // Publication location lookup and cache

    private getPublicationLocationCache(
        identifier: string,
        publicationDirectoriesRevision: number,
    ): IPublicationStorageLocationCacheEntry | undefined {
        const cached = this.publicationLocationCache.get(identifier);
        if (!cached) {
            return undefined;
        }

        if (cached.publicationDirectoriesRevision === publicationDirectoriesRevision) {
            return cached;
        }

        this.invalidatePublicationLocationCache(identifier);
        return undefined;
    }

    private setPublicationLocationCache(
        identifier: string,
        entry: Omit<IPublicationStorageLocationCacheEntry, "publicationDirectoriesRevision">,
        publicationDirectoriesRevision = this.getPublicationDirectoriesRevision(),
    ) {
        const cached = this.getPublicationLocationCache(identifier, publicationDirectoriesRevision);
        this.publicationLocationCache.set(identifier, {
            ...cached,
            ...entry,
            publicationDirectoriesRevision,
        });
    }

    private invalidatePublicationLocationCache(identifier: string) {
        this.publicationLocationCache.delete(identifier);
    }

    private incrementCallCountByIdentifier(callCountByIdentifier: Map<string, number>, identifier: string): number {
        const callCount = (callCountByIdentifier.get(identifier) || 0) + 1;
        callCountByIdentifier.set(identifier, callCount);
        return callCount;
    }

    public async getPublicationPath(identifier: string): Promise<string> {

        assertUUIDv4(identifier);

        const callCount = this.incrementCallCountByIdentifier(this.getPublicationPathCallCountByIdentifier, identifier);

        const { directories, revision } = await this.getPublicationDirectoryCacheSnapshot();
        const cached = this.getPublicationLocationCache(identifier, revision);
        if (cached?.directoryPath) {
            debug("getPublicationPath cache hit", { callCount, identifier, revision, directoryPath: cached.directoryPath });
            return cached.directoryPath;
        }

        debug("getPublicationPath cache miss", { callCount, identifier, revision, directories });
        const directoryPath = await this.getPublicationPathFromDirectories(identifier, directories, revision);
        debug("getPublicationPath cache fill", { callCount, identifier, revision, directoryPath });
        return directoryPath;
    }

    public async getPublicationEpubPath(identifier: string): Promise<string> {

        assertUUIDv4(identifier);

        const callCount = this.incrementCallCountByIdentifier(this.getPublicationEpubPathCallCountByIdentifier, identifier);

        const { directories, revision } = await this.getPublicationDirectoryCacheSnapshot();
        const cached = this.getPublicationLocationCache(identifier, revision);
        if (cached?.epubPath && cached.directoryPath && path.dirname(cached.epubPath) === cached.directoryPath) {
            debug("getPublicationEpubPath epub cache hit", callCount, identifier, revision, cached.directoryPath, cached.epubPath);
            return cached.epubPath;
        }

        if (cached?.epubPath) {
            debug("getPublicationEpubPath cache ignored", callCount, identifier, revision, cached.directoryPath, cached.epubPath);
        }

        let root: string;
        if (cached?.directoryPath) {
            debug("getPublicationEpubPath directory cache hit", callCount, identifier, revision, cached.directoryPath);
            root = cached.directoryPath;
        } else {
            debug("getPublicationEpubPath cache miss", { callCount, identifier, revision, directories });
            root = await this.getPublicationPathFromDirectories(identifier, directories, revision);
        }

        try {
            const files = await fs.promises.readdir(root, {withFileTypes: true});
            debug("getPublicationEpubPath: readdir", root);
            for (const file of files) {
                if (!file.isFile()) {
                    continue;
                }
                debug(`${file.name} from ${file.parentPath}`);
                const ext = path.extname(file.name);
                if (this.isStorablePublicationExtension(ext)) {
                    const filePath = path.join(file.parentPath, file.name);
                    const stats = await fs.promises.stat(filePath);
                    if (stats.isFile() && stats.size > 10) {
                        this.setPublicationLocationCache(identifier, {
                            directoryPath: root,
                            epubPath: filePath,
                        }, revision);
                        debug("getPublicationEpubPath epub cache fill", callCount, identifier, revision, root, filePath);
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

    private async getPublicationPathFromDirectories(
        identifier: string,
        directories: string[],
        publicationDirectoriesRevision: number,
    ): Promise<string> {

        for (const directoryPath of directories) {
            const publicationPath = path.join(directoryPath, identifier);
            try {
                const stats = await fs.promises.stat(publicationPath);
                if (stats.isDirectory()) {
                    this.setPublicationLocationCache(identifier, {
                        directoryPath: publicationPath,
                    }, publicationDirectoriesRevision);
                    return publicationPath;
                }
            } catch (e) {
                debug(e);
            }
        }

        throw new Error("publication folder path not found");
    }

    private async getPublicationDirectoryCacheSnapshot(): Promise<IPublicationStorageDirectoryCacheSnapshot> {
        await this.ready();
        // Capture both values without an async delay so cache entries are tagged with
        // the revision that actually matches the directory list they found.
        const revision = this.getPublicationDirectoriesRevision();
        const directories = this.getPublicationDirectoriesFromCurrentState();
        return {
            directories,
            revision,
        };
    }

    private async listPublicationIdPathEntries(): Promise<IPublicationStoragePathEntry[]> {

        const { directories } = await this.getPublicationDirectoryCacheSnapshot();
        const entries: IPublicationStoragePathEntry[] = [];
        for (const directoryPath of directories) {
            let files: fs.Dirent[];
            try {
                files = await fs.promises.readdir(directoryPath, { withFileTypes: true });
            } catch (e) {
                debug(`Cannot read publication storage directory ${directoryPath}`, e);
                continue;
            }

            for (const file of files) {
                const identifier = getCanonicalUUIDv4FileNameFromFs(file.name);
                if (
                    identifier &&
                    file.isDirectory()
                ) {
                    entries.push({
                        identifier,
                        directoryPath: path.join(directoryPath, file.name),
                    });
                }
            }
        }
        return entries;
    }

    public async listPublicationIdPath(): Promise<string[]> {

        const pubIdSet = new Set<string>();
        const entries = await this.listPublicationIdPathEntries();
        for (const entry of entries) {
            pubIdSet.add(entry.identifier);
        }
        return [...pubIdSet.values()];
    }

    // Publication integrity and recovery

    private getFileNameFromDocumentFileUrl(identifier: string, fileUrl: string): string | undefined {

        if (!fileUrl) {
            return undefined;
        }

        let parsedUrl: URL;
        try {
            parsedUrl = new URL(fileUrl);
        } catch {
            return undefined;
        }

        if (parsedUrl.protocol !== `${URL_PROTOCOL_STORE}:`) {
            return undefined;
        }

        if (parsedUrl.hostname.toLowerCase() !== identifier.toLowerCase()) {
            return undefined;
        }

        try {
            const fileName = decodeURIComponent(parsedUrl.pathname).replace(/^\/+/, "");
            if (!fileName || fileName === "." || fileName === ".." || fileName !== path.basename(fileName)) {
                return undefined;
            }
            return fileName;
        } catch {
            return undefined;
        }
    }

    private async checkDocumentFilesIntegrity(
        document: PublicationDocument,
        publicationPath: string,
    ): Promise<IPublicationStorageIntegrityIssue[]> {

        const issues: IPublicationStorageIntegrityIssue[] = [];
        const files: File[] = [
            ...(document.files || []),
            ...(document.coverFile ? [document.coverFile] : []),
        ];

        if (!files.length) {
            issues.push({
                type: "missing-document-file",
                identifier: document.identifier,
                directoryPath: toFilePathArray(publicationPath),
                message: `Publication ${document.identifier} has no file metadata in the database.`,
            });
            return issues;
        }

        for (const file of files) {
            const fileName = this.getFileNameFromDocumentFileUrl(document.identifier, file.url);
            if (!fileName) {
                issues.push({
                    type: "invalid-document-file-url",
                    identifier: document.identifier,
                    fileUrl: file.url,
                    directoryPath: toFilePathArray(publicationPath),
                    message: `Publication ${document.identifier} contains an invalid stored file URL: ${file.url}`,
                });
                continue;
            }

            const filePath = path.join(publicationPath, fileName);
            try {
                const stat = await fs.promises.stat(filePath);
                if (!stat.isFile() || stat.size <= 0) {
                    issues.push({
                        type: "missing-document-file",
                        identifier: document.identifier,
                        fileUrl: file.url,
                        filePath,
                        directoryPath: toFilePathArray(publicationPath),
                        message: `Publication ${document.identifier} database file reference is not a readable file: ${filePath}`,
                    });
                }
            } catch {
                issues.push({
                    type: "missing-document-file",
                    identifier: document.identifier,
                    fileUrl: file.url,
                    filePath,
                    directoryPath: toFilePathArray(publicationPath),
                    message: `Publication ${document.identifier} database file reference is missing on disk: ${filePath}`,
                });
            }
        }

        return issues;
    }

    private async getStoredPublicationHash(
        filePath: string,
    ): Promise<string | undefined> {
        const ext = path.extname(filePath);
        const isPDF = isAcceptedExtension("pdf", ext);

        try {
            return isPDF ?
                await computeFileHash(filePath) :
                await extractCrc32OnZip(filePath);
        } catch (e) {
            debug("Cannot compute stored publication hash", filePath, e);
            return undefined;
        }
    }

    public async checkPublicationsIntegrity(
        publicationDocuments: PublicationDocument[] = [],
    ): Promise<IPublicationStorageIntegrityResult> {

        const entries = await this.listPublicationIdPathEntries();
        const entriesByIdentifier = new Map<string, IPublicationStoragePathEntry[]>();
        for (const entry of entries) {
            const entriesForIdentifier = entriesByIdentifier.get(entry.identifier) || [];
            entriesForIdentifier.push(entry);
            entriesByIdentifier.set(entry.identifier, entriesForIdentifier);
        }

        const documentsByIdentifier = new Map<string, PublicationDocument>();
        const documentsByHash = new Map<string, PublicationDocument[]>();
        for (const document of publicationDocuments) {
            documentsByIdentifier.set(document.identifier, document);
            if (document.hash) {
                const docs = documentsByHash.get(document.hash) || [];
                docs.push(document);
                documentsByHash.set(document.hash, docs);
            }
        }

        const good: string[] = [];
        const bad: string[] = [];
        const issues: IPublicationStorageIntegrityIssue[] = [];
        const duplicateHashPublicationIdentifierSet = new Set<string>();
        for (const [hash, documents] of documentsByHash) {
            if (documents.length < 2) {
                continue;
            }
            for (const document of documents) {
                duplicateHashPublicationIdentifierSet.add(document.identifier);
                issues.push({
                    type: "duplicate-database-hash",
                    identifier: document.identifier,
                    hash,
                    matchingIdentifier: documents
                        .map(({ identifier }) => identifier)
                        .filter((identifier) => identifier !== document.identifier),
                    message: `Publication ${document.identifier} has database hash ${hash}, which is also used by another publication.`,
                });
            }
        }

        for (const [pubId, pathEntries] of entriesByIdentifier) {
            let publicationIsGood = true;
            const publicationPath = pathEntries[0]?.directoryPath;
            let publicationArchivePath: string | undefined;

            if (pathEntries.length > 1) {
                publicationIsGood = false;
                issues.push({
                    type: "duplicate-directory",
                    identifier: pubId,
                    directoryPath: pathEntries.map((entry) => entry.directoryPath),
                    message: `Publication ${pubId} is present in multiple storage directories.`,
                });
            }

            try {
                publicationArchivePath = await this.getPublicationEpubPath(pubId);
                if (publicationArchivePath) {
                    // archive exists
                }
            } catch {
                publicationIsGood = false;
                issues.push({
                    type: "missing-archive",
                    identifier: pubId,
                    directoryPath: toFilePathArray(publicationPath),
                    message: `Publication ${pubId} storage directory does not contain a readable publication archive.`,
                });
            }

            const document = documentsByIdentifier.get(pubId);
            if (duplicateHashPublicationIdentifierSet.has(pubId)) {
                publicationIsGood = false;
            }
            if (document && publicationPath) {
                const documentIssues = await this.checkDocumentFilesIntegrity(document, publicationPath);
                if (documentIssues.length) {
                    publicationIsGood = false;
                    issues.push(...documentIssues);
                }
            }
            if (!document && publicationArchivePath) {
                const hash = await this.getStoredPublicationHash(publicationArchivePath);
                const matchingDocument = documentsByHash.get(hash) || [];
                if (matchingDocument.length) {
                    publicationIsGood = false;
                    issues.push({
                        type: "disk-hash-already-in-database",
                        identifier: pubId,
                        directoryPath: toFilePathArray(publicationPath),
                        filePath: publicationArchivePath,
                        hash,
                        matchingIdentifier: matchingDocument.map(({ identifier }) => identifier),
                        message: `Publication ${pubId} is missing from the database, but its hash ${hash} already exists on publication(s) ${matchingDocument.map(({ identifier }) => identifier).join(" | ")}.`,
                    });
                }
            }

            if (publicationIsGood) {
                good.push(pubId);
            } else {
                bad.push(pubId);
            }
        }

        for (const document of publicationDocuments) {
            if (!entriesByIdentifier.has(document.identifier)) {
                issues.push({
                    type: "missing-directory",
                    identifier: document.identifier,
                    message: `Publication ${document.identifier} is present in the database but missing from publication storage.`,
                });
            }
        }

        return {
            good,
            bad,
            issues,
        };

    }

    public async listRecoverablePublications(
        publicationDocuments: PublicationDocument[],
    ): Promise<IPublicationStorageRecoverablePublication[]> {

        const publicationIdentifierDataBase = new Set(publicationDocuments.map(({ identifier }) => identifier));
        const integrity = await this.checkPublicationsIntegrity(publicationDocuments);
        const recoverablePublicationIdentifierDisk = integrity.good.filter((id) => !publicationIdentifierDataBase.has(id));
        const recoverablePublications: IPublicationStorageRecoverablePublication[] = [];

        for (const identifier of recoverablePublicationIdentifierDisk) {
            try {
                const filePath = await this.getPublicationEpubPath(identifier);
                recoverablePublications.push({
                    identifier,
                    filePath,
                });
            } catch (e) {
                debug(e);
            }
        }

        return recoverablePublications;
    }

    public async getStoredPublicationFiles(identifier: string): Promise<File[]> {

        assertUUIDv4(identifier);

        const publicationDirectoryPath = await this.getPublicationPath(identifier);
        const files = await fs.promises.readdir(publicationDirectoryPath, { withFileTypes: true });
        const publicationFiles: File[] = [];

        for (const file of files) {
            if (!file.isFile()) {
                continue;
            }

            const extWithDot = normalizeExtension(path.extname(file.name));
            if (
                !this.isStorablePublicationExtension(extWithDot)
                && !file.name.toLowerCase().startsWith("cover.")
            ) {
                continue;
            }

            const ext = getExtensionWithoutDot(extWithDot);
            const filePath = path.join(publicationDirectoryPath, file.name);
            publicationFiles.push({
                url: `${URL_PROTOCOL_STORE}://${identifier}/${file.name}`,
                ext,
                contentType: getStoredPublicationFileMimeTypeFromExtension(extWithDot),
                size: getFileSize(filePath),
            });
        }

        return publicationFiles;
    }

    // Publication import helpers

    private async storePublicationBook(
        identifier: string,
        srcPath: string,
        dstPath: string,
    ): Promise<File> {

        const extension = path.extname(srcPath);
        const ext = getExtensionWithoutDot(this.getStorablePublicationExtension(extension));

        const filename = `book.${ext}`;
        const bookDstPath = path.join(
            dstPath,
            filename,
        );

        await fs.promises.copyFile(srcPath, bookDstPath);
        const file: File = {
            url: `${URL_PROTOCOL_STORE}://${identifier}/${filename}`,
            ext,
            contentType: getStoredPublicationFileMimeTypeFromExtension(ext),
            size: getFileSize(bookDstPath),
        };
        this.setPublicationLocationCache(identifier, {
            directoryPath: dstPath,
            epubPath: bookDstPath,
        });

        return file;
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

        const coverTypeExt = findExtWithMimeType(coverLink.TypeLink);
        const coverType = findMimeTypeWithExtension(coverTypeExt);
        const zipStream = await zip.entryStreamPromise(coverLink.Href);
        const zipBuffer = await streamToBufferPromise(zipStream.stream);

        // after PublicationParsePromise, cleanup zip handler
        r2Publication.freeDestroy();

        // Remove start dot in extensoion
        const coverExt = getExtensionWithoutDot(path.extname(coverLink.Href));
        const ext = coverTypeExt || coverExt;
        const contentType = coverType || findMimeTypeWithExtension(coverExt);
        const coverFilename = `cover.${ext}`;
        const coverDstPath = path.join(
            dstPath,
            coverFilename,
        );

        // Write cover to fs
        await fs.promises.writeFile(coverDstPath, zipBuffer);

        // Return cover file information
        return {
            url: `${URL_PROTOCOL_STORE}://${identifier}/${coverFilename}`,
            ext,
            contentType,
            size: getFileSize(coverDstPath),
        };
    }
}
