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
import { _APP_NAME, _APP_VERSION, _PACK_NAME } from "readium-desktop/preprocessor-directives";
import { USER_DATA_FOLDER, FORCE_PROD_DB_IN_DEV } from "readium-desktop/common/constant";
import { IPublicationCheckerState } from "readium-desktop/common/redux/states/publicationsChecker";
import { publicationActions } from "readium-desktop/common/redux/actions";
import { winActions } from "../../actions";
import { tryCatch } from "readium-desktop/utils/tryCatch";

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
 
    const { good: approvedPublicationIdentifierDisk, bad: rejectedPublicationIdentifierDisk } = yield* callTyped(() => diMainGet("publication-storage").checkPublicationsIntegrity());
    const publicationIdentifierDisk = [...approvedPublicationIdentifierDisk, ...rejectedPublicationIdentifierDisk];
    
    yield* delayTyped(1);
    const publicationIdentifierNotFoundOnDiskButFoundOnDataBase: string[] = publicationIdentifierDataBase.filter((id) => !publicationIdentifierDisk.includes(id));
    const publicationIdentifierNotFoundOnDataBaseButFoundOnDisk: string[] = publicationIdentifierDisk.filter((id) => !publicationIdentifierDataBase.includes(id));
    const publicationIdentifierMatchedDiskDataBaseArray = publicationIdentifierDataBase.filter((id) => publicationIdentifierDisk.includes(id));
    const publicationIdentifierApprovedMatchedDiskDataBaseArray = publicationIdentifierDataBase.filter((id) => approvedPublicationIdentifierDisk.includes(id));

    debug("==> Publication Id rejected in Disk:");
    for (const id of rejectedPublicationIdentifierDisk) {
        debug(`pubId: ${id}`);
        try {
            const filePath = yield* callTyped(() => diMainGet("publication-storage").findPublicationPath(id));
            debug(`filePath: ${filePath}`);
            debug("file in directory:");
            const files = yield* callTyped(() => fs.promises.readdir(filePath));
            for (const file of files) {
                const stat = yield* callTyped(() => tryCatch(() => fs.promises.stat(path.join(filePath, file)), ""));
                debug(`\t${file} size=${stat?.size} isFile=${stat?.isFile()}`);
            }

        } catch {
            debug(`pubId: ${id} throw an error when reading the directory !`);
        }

        try {
            const publicationDocument = yield* callTyped(() => diMainGet("publication-repository").findByPublicationIdentifier(id));
            debug(`publicationDocument: ${JSON.stringify(publicationDocument, null, 4)}`);
        } catch {
            debug("Not found on DataBase");
        }
        dumpLogs = true;
    }
    debug("--------");

    debug("==> publication identifier NOT found on disk but found on database:");
    for (const id of publicationIdentifierNotFoundOnDiskButFoundOnDataBase) {
        debug(`pubId: ${id}`);
        const publicationDocument = yield* callTyped(() => diMainGet("publication-repository").findByPublicationIdentifier(id));
        debug(`publicationDocument: ${JSON.stringify(publicationDocument, null, 4)}`);
        dumpLogs = true;
    }
    debug("--------");

    debug("==> publication identifier found on disk but NOT found on database:");
    for (const id of publicationIdentifierNotFoundOnDataBaseButFoundOnDisk) {
        debug(`pubId: ${id}`);
        try {
            const filePath = yield* callTyped(() => diMainGet("publication-storage").findPublicationPath(id));
            debug(`filePath: ${filePath}`);
            debug("file in directory:");
            const files = yield* callTyped(() => fs.promises.readdir(filePath));
            for (const file of files) {
                const stat = yield* callTyped(() => tryCatch(() => fs.promises.stat(path.join(filePath, file)), ""));
                debug(`\t${file} size=${stat?.size} isFile=${stat?.isFile()}`);
            }

        } catch {
            debug(`pubId: ${id} throw an error when reading the directory !`);
        }
        dumpLogs = true;
    }
    debug("--------");

    debug(`${publicationIdentifierDisk.length} UUID directories were found on disk, of which ${approvedPublicationIdentifierDisk.length} contain an approved publication archive book.`);
    debug(`${publicationIdentifierDataBase.length} publication(s) found in database`);
    debug(`${publicationIdentifierNotFoundOnDiskButFoundOnDataBase.length} publication(s) found in database but not found on the disk`);
    debug(`${publicationIdentifierNotFoundOnDataBaseButFoundOnDisk.length} publication(s) found in disk but not found on the database`);
    debug(`${publicationIdentifierMatchedDiskDataBaseArray.length} publication(s) matched between the database and the disk`);
    debug(`${publicationIdentifierApprovedMatchedDiskDataBaseArray.length} publication(s) approved and matched between the database and the disk (this is the number of publications you can see in Thorium All Books...)`);
    if (publicationIdentifierNotFoundOnDiskButFoundOnDataBase.length || publicationIdentifierNotFoundOnDataBaseButFoundOnDisk.length) {
        dumpLogs = true;
    }
    yield* delayTyped(1);

    const publicationCheckerState: IPublicationCheckerState = {
        publicationIdentifierDataBase,
        // publicationIdentifierDisk = [...approvedPublicationIdentifierDisk, ...rejectedPublicationIdentifierDisk];
        approvedPublicationIdentifierDisk, rejectedPublicationIdentifierDisk,
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
        thoriumPublicationPath: yield* callTyped(() => diMainGet("publication-storage").getVaultPath()),
    }, null, 4)}\n`;
    if (dumpLogs) {
        yield* callTyped(() => fs.promises.appendFile(appLogs, dump));

        yield* takeTyped(winActions.library.openSucess.ID);
        yield* delayTyped(1000); // 1s
        yield* putTyped(publicationActions.checker.build(publicationCheckerState));
    }

}
