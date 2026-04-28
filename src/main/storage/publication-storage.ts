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
import { acceptedExtensionObject, isAcceptedExtension, publicationExtensionStoredOnDisk } from "readium-desktop/common/extension";
import { File } from "readium-desktop/common/models/file";
import { PublicationView } from "readium-desktop/common/views/publication";
import { ContentType } from "readium-desktop/utils/contentType";
import { getFilePathNormalize, getFileSize, rmrf } from "readium-desktop/utils/fs";
import { findMimeTypeWithExtension } from "readium-desktop/utils/mimeTypes";

import { PublicationParsePromise } from "@r2-shared-js/parser/publication-parser";
import { streamToBufferPromise } from "@r2-utils-js/_utils/stream/BufferUtils";
import { IZip } from "@r2-utils-js/_utils/zip/zip";
import debug_ from "debug";
import { sanitizeForFilename } from "readium-desktop/common/safe-filename";
import { URL_PROTOCOL_STORE } from "readium-desktop/common/streamerProtocol";
import { IReaderStateReaderPersistence } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { diMainGet } from "../di";
import { PublicationDocument } from "../db/document/publication";
import { computeFileHash, extractCrc32OnZip } from "../tools/crc";

const debug = debug_("readium-desktop:main/storage/pub-storage");

export type TFileTypePubStorage = Extract<keyof IReaderStateReaderPersistence, "locator" | "config" | "disableRTLFlip" | "divina" | "allowCustomConfig" | "noteTotalCount" | "pdfConfig">;
// "bound" is not included, saved only in publication-data

interface IPublicationStoragePathEntry {
    identifier: string;
    directoryPath: string;
}

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

const isUUIDv4 = (uuid: string) => /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(uuid);
const assertUUIDv4 = (uuid: string) => {
    if (!isUUIDv4(uuid)) {
        throw new Error("not an uuidv4 identifier !");
    }
};

const toFilePathArray = (filePath: string | undefined): string[] | undefined => filePath ? [filePath] : undefined;

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

    private assertAndGetFileName = (type: TFileTypePubStorage) => {
        const fileName = type === "locator" ? "locator.json" : type === "config" ? "config.json" : type === "disableRTLFlip" ? "disableRTLFlip.json" : type === "divina" ? "divina.json" : type === "allowCustomConfig" ? "allowCustomConfig.json" : type === "noteTotalCount" ? "noteTotalCount.json" : type === "pdfConfig" ? "pdfConfig.json" : "";
        if (!fileName) {
            throw new Error("fileType not found");
        }
        return fileName;
    };

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

        const publicationDirectory = diMainGet("publication-directory");
        await publicationDirectory.ready();
        const directoryPath = await publicationDirectory.getDirectoryPath();
        const defaultDirectoryPath = publicationDirectory.defaultDirectory;
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

        const coverFile = await this.storePublicationCover(
            identifier, srcPath, publicationDirectoryPath);
        if (coverFile) {
            files.push(coverFile);
        }

        return files;
    }

    private __publicationEpubPathMap = new Map<string, string>();
    public async removePublication(identifier: string /*, preservePublicationOnFileSystem?: string*/) {

        assertUUIDv4(identifier);

        this.__publicationEpubPathMap.delete(identifier);


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

        const publicationDirectory = diMainGet("publication-directory");
        await publicationDirectory.ready();
        const defaultPublicationDirectoryPath = path.join(publicationDirectory.defaultDirectory, identifier);
        try {
            const stat = await fs.promises.stat(defaultPublicationDirectoryPath);
            if (stat.isDirectory()) {
                await rmrf(defaultPublicationDirectoryPath);
            }
        } catch {
            // ignore
        }


        // TODO: rm or unlink?
        if (publicationDirectory.userDirectory) {
            const userPublicationDirectoryPath = path.join(publicationDirectory.userDirectory, identifier);
            try {
                const stat = await fs.promises.stat(userPublicationDirectoryPath);
                if (stat.isDirectory()) {
                    await rmrf(userPublicationDirectoryPath);
                }
            } catch {
                // ignore
            }
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

        const entries = await this.getPublicationPathEntries(identifier);
        const firstEntry = entries[0];
        if (firstEntry) {
            if (this.__publicationEpubPathMap.has(identifier)) {
                if (path.dirname(this.__publicationEpubPathMap.get(identifier)) !== firstEntry.directoryPath) {
                    debug("publicationEpubPath cache invalidation for", identifier);
                    this.__publicationEpubPathMap.delete(identifier);
                }
            }
            return firstEntry.directoryPath;
        }

        throw new Error("publication folder path not found");
    }

    private async getPublicationDirectories(): Promise<string[]> {

        const publicationDirectory = diMainGet("publication-directory");
        await publicationDirectory.ready();

        const directories = [
            publicationDirectory.defaultDirectory,
        ];
        if (
            publicationDirectory.userDirectory
            && getFilePathNormalize(publicationDirectory.userDirectory) !== getFilePathNormalize(publicationDirectory.defaultDirectory)
        ) {
            directories.push(publicationDirectory.userDirectory);
        }
        return directories;
    }

    private async getPublicationPathEntries(identifier: string): Promise<IPublicationStoragePathEntry[]> {

        assertUUIDv4(identifier);

        const entries: IPublicationStoragePathEntry[] = [];
        const directories = await this.getPublicationDirectories();
        for (const directoryPath of directories) {
            const publicationPath = path.join(directoryPath, identifier);
            try {
                const stats = await fs.promises.stat(publicationPath);
                if (stats.isDirectory()) {
                    entries.push({
                        identifier,
                        directoryPath: publicationPath,
                    });
                }
            } catch (e) {
                debug(e);
            }
        }
        return entries;
    }

    private async listPublicationIdPathEntries(): Promise<IPublicationStoragePathEntry[]> {

        const directories = await this.getPublicationDirectories();
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
                if (
                    isUUIDv4(file.name) &&
                    file.isDirectory()
                ) {
                    entries.push({
                        identifier: file.name,
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

    private getStoredPublicationContentType(ext: string): string {
        const normalizedExt = ext.startsWith(".") ? ext : `.${ext}`;
        if (normalizedExt === acceptedExtensionObject.audiobook) {
            return ContentType.AudioBookPacked;
        }
        if (normalizedExt === acceptedExtensionObject.audiobookLcp || normalizedExt === acceptedExtensionObject.audiobookLcpAlt) {
            return ContentType.AudioBookPackedLcp;
        }
        if (normalizedExt === acceptedExtensionObject.divina) {
            return ContentType.DivinaPacked;
        }
        if (normalizedExt === acceptedExtensionObject.webpub) {
            return ContentType.webpubPacked;
        }
        if (normalizedExt === acceptedExtensionObject.pdfLcp) {
            return ContentType.lcppdf;
        }
        if (normalizedExt === acceptedExtensionObject.daisy) {
            return ContentType.Zip;
        }

        return findMimeTypeWithExtension(normalizedExt) || ContentType.Epub;
    }

    public async getStoredPublicationFiles(identifier: string): Promise<File[]> {

        assertUUIDv4(identifier);

        const publicationDirectoryPath = await this.findPublicationPath(identifier);
        const files = await fs.promises.readdir(publicationDirectoryPath, { withFileTypes: true });
        const publicationFiles: File[] = [];

        for (const file of files) {
            if (!file.isFile()) {
                continue;
            }

            const extWithDot = path.extname(file.name).toLowerCase();
            if (
                !publicationExtensionStoredOnDisk.includes(extWithDot)
                && !file.name.toLowerCase().startsWith("cover.")
            ) {
                continue;
            }

            const ext = extWithDot.slice(1);
            const filePath = path.join(publicationDirectoryPath, file.name);
            publicationFiles.push({
                url: `${URL_PROTOCOL_STORE}://${identifier}/${file.name}`,
                ext,
                contentType: this.getStoredPublicationContentType(extWithDot),
                size: getFileSize(filePath),
            });
        }

        return publicationFiles;
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
