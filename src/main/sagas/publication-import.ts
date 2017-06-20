import { ipcMain } from "electron";

import { PUBLICATION_FILE_IMPORT_REQUEST } from "readium-desktop/events/ipc";

import { FilesMessage } from "readium-desktop/models/ipc";

export function waitForPublicationFileImport() {
    ipcMain.on(
        PUBLICATION_FILE_IMPORT_REQUEST,
        (event: any, msg: FilesMessage) => {
            console.log("Import file ipc");
        });
}
