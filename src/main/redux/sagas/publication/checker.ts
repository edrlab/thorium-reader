// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import { SagaGenerator, call as callTyped, delay as delayTyped, put as putTyped, take as takeTyped } from "typed-redux-saga/macro";
import { diMainGet } from "readium-desktop/main/di";
import * as fs from "node:fs";
import * as path from "node:path";
import { publicationExtensionStoredOnDisk } from "readium-desktop/common/extension";
import { _APP_NAME, _APP_VERSION, _PACK_NAME } from "readium-desktop/preprocessor-directives";
import { USER_DATA_FOLDER, FORCE_PROD_DB_IN_DEV } from "readium-desktop/common/constant";
import { IPublicationCheckerDirent, IPublicationCheckerState } from "readium-desktop/common/redux/states/publicationsChecker";
import { publicationActions } from "readium-desktop/common/redux/actions";
import { winActions } from "../../actions";

// TODO: use app.getPath("logs"); instead
const folderPath = path.join(
    USER_DATA_FOLDER,
    !FORCE_PROD_DB_IN_DEV && (__TH__IS_DEV__ || __TH__IS_CI__) ? "app-logs-dev" : "app-logs",
);
const PROCESS_LOGS = "publicationsIntegrityChecker.txt";
const appLogs = path.join(
    folderPath,
    PROCESS_LOGS,
);

if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
}

// Logger
const filename_ = "readium-desktop:main:redux:sagas:publication:checker";
const debug__ = debug_(filename_);

export function* publicationIntegrityChecker(): SagaGenerator<void> {

    let dumpLogs = false;
    let dump = "#############################################\n";
    dump += `Date: ${(new Date()).toISOString()}\n`;
    const debug = (str: string) => {
        debug__(str);
        dump += str + "\n";
    };

    // const pubs = yield* selectTyped((state: RootState) => state.publication.db);
    const publicationDocuments = yield* callTyped(() => diMainGet("publication-repository").findAll());
    const publicationIdentifierDataBase = publicationDocuments.map(({ identifier }) => identifier);
    
    yield* delayTyped(1);
    const publicationDirectoryPath = yield* callTyped(() => diMainGet("publication-storage").getRootPath());
    const files = yield* callTyped(() => fs.promises.readdir(publicationDirectoryPath, {withFileTypes: true}));
    const rejectedFileInPubDir: fs.Dirent[] = [];
    const approvedFileInPubDirDisk: Array<{ id: string, title: string, identifiedFileArray: fs.Dirent[], unknownFileArray: fs.Dirent[] }> = [];
    const publicationIdentifierDisk: string[] = [];
    for (const file of files) {
        if (
            /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(file.name) &&
            file.isDirectory()
            // && publicationIdentifiersDataBase.includes(file.name)
        ) {
            publicationIdentifierDisk.push(file.name);

            const filePath = path.join(file.parentPath, file.name);

            yield* delayTyped(1);
            const publicationDirectoryFiles = yield* callTyped(() => fs.promises.readdir(filePath, { withFileTypes: true }));

            // if (publicationDirectoryFiles.length !== 3) {
            //     debug(`uuid directory: ${file.name} does not have 3 files but ${publicationDirectoryFiles.length} files`);
            // }

            const publicationFileNameReference = [
                {base: "book", ext: publicationExtensionStoredOnDisk},
                {base: "cover", ext: undefined},
                {base: "manifest", ext: [".json"]},
            ];
            const identifiedFileArray: fs.Dirent[] = [];
            const unknownFileArray: fs.Dirent[] = [];
            for (const pubFile of publicationDirectoryFiles) {
                const ext = path.extname(pubFile.name);
                const base = path.basename(pubFile.name, ext);
                if (publicationFileNameReference.find(({base: _base, ext: _ext}) => {
                    return base === _base && (!_ext || _ext.includes(ext));
                })) {
                    identifiedFileArray.push(pubFile);
                } else {
                    unknownFileArray.push(pubFile);
                }
            }

            yield* delayTyped(1);
            approvedFileInPubDirDisk.push({id: file.name, title: publicationDocuments.find(({identifier}) => identifier === file.name)?.title, identifiedFileArray, unknownFileArray});
        } else {
            rejectedFileInPubDir.push(file);
            dumpLogs = true;
        }

    }

    yield* delayTyped(1);
    const approvedFileWithBookArchiveInPubDirDisk = approvedFileInPubDirDisk.filter((obj) => !!obj.unknownFileArray.length || !obj.identifiedFileArray.find((f) => f.name.startsWith("book."))); // TODO: make a reference to publication-storage
    const publicationIdentifierApprovedInDisk = approvedFileWithBookArchiveInPubDirDisk.map(({ id }) => id);
    const publicationIdentifierNotFoundOnDiskButFoundOnDataBase: string[] = publicationIdentifierDataBase.filter((id) => !publicationIdentifierDisk.includes(id));
    const publicationIdentifierNotFoundOnDataBaseButFoundOnDisk: string[] = publicationIdentifierApprovedInDisk.filter((id) => !publicationIdentifierDataBase.includes(id));
    const publicationIdentifierMatchedDiskDataBaseArray = publicationIdentifierDataBase.filter((id) => publicationIdentifierDisk.includes(id));

    debug("==> uuid publication directory not correct because not a directory, uuid or not found in database and need to be removed:");
    for (const file of rejectedFileInPubDir) {
        debug(`Directory: ${file.isDirectory()}, File: ${file.isFile()}, Filename: ${file.name}`);
        dumpLogs = true;
    }
    debug("--------");

    debug("==> publication identifier not found in publication directory:");
    for (const id of publicationIdentifierNotFoundOnDiskButFoundOnDataBase) {
        debug(`pubId: ${id}`);
        dumpLogs = true;
    }
    debug("--------");

    debug(`${publicationIdentifierDisk.length} UUID directories were found on disk, of which ${publicationIdentifierApprovedInDisk.length} contain an approved publication archive book.`);
    debug(`${publicationIdentifierDataBase.length} publication(s) found in database`);
    debug(`${publicationIdentifierNotFoundOnDiskButFoundOnDataBase.length} publication(s) found in database but not found on the disk`);
    debug(`${publicationIdentifierNotFoundOnDataBaseButFoundOnDisk.length} publication(s) found in disk but not found on the database`);
    debug(`${publicationIdentifierMatchedDiskDataBaseArray.length} publication(s) matched between the database and the disk`);
    if (publicationIdentifierNotFoundOnDiskButFoundOnDataBase.length || publicationIdentifierNotFoundOnDataBaseButFoundOnDisk.length) {
        dumpLogs = true;
    }
    yield* delayTyped(1);

    debug("==> files in publication uuid directory not identified and not correct:");
    for (const obj of approvedFileWithBookArchiveInPubDirDisk) {
        dumpLogs = true;
        debug(`From ${obj.id} (${obj.title}) =>`);
        for (const a of obj.unknownFileArray) {
            debug(`\tfileName: ${a.name}`);
        }
        debug(`whereas the identified files are (${obj.identifiedFileArray.length}):`);
        for (const a of obj.identifiedFileArray) {
            debug(`\tfileName: ${a.name}`);
        }
    }
    debug(`seems to have ${approvedFileInPubDirDisk.length - approvedFileWithBookArchiveInPubDirDisk.length} publication(s) correct and identified in publication directory`);
    debug("--------");

    const convertFSDirent = (d: fs.Dirent): IPublicationCheckerDirent => ({
        name: d.name,
        parentPath: d.parentPath,
        isDirectory: d.isDirectory(),
        isFile: d.isFile(),
    });

    yield* delayTyped(1);
    const publicationCheckerState: IPublicationCheckerState = {
        publicationDirectoryPath,
        publicationIdentifierDataBase,
        publicationIdentifierDisk,
        approvedFileInPubDir: approvedFileInPubDirDisk.map(({ identifiedFileArray, unknownFileArray, ...a }) => ({ ...a, identifiedFileArray: identifiedFileArray.map((a) => convertFSDirent(a)), unknownFileArray: unknownFileArray.map((a) => convertFSDirent(a)) })),
        rejectedFileInPubDir: rejectedFileInPubDir.map((a) => convertFSDirent(a)),
        dump,
    };

    yield* delayTyped(1);
    dump += `Process: ${JSON.stringify({
        node_version: process.version,
        platform: process.platform,
        arch: process.arch,
        argv: process.argv,
        MSWindowsStore: process.windowsStore,
        thoriumAppName: _APP_NAME,
        thoriumAppVersion: _APP_VERSION,
        thoriumPackName: _PACK_NAME,
        thoriumUserDataPath: USER_DATA_FOLDER,
        thoriumPublicationPath: publicationDirectoryPath,
    }, null, 4)}\n`;
    if (dumpLogs) {
        yield* callTyped(() => fs.promises.appendFile(appLogs, dump));

        yield* takeTyped(winActions.library.openSucess.ID);
        yield* delayTyped(1000); // 1s
        yield* putTyped(publicationActions.checker.build(publicationCheckerState));
    }

}
