import { SagaIterator } from "redux-saga";
import { take } from "redux-saga/effects";

import { DOWNLOAD_FINISH, DOWNLOAD_PROGRESS }
    from "readium-desktop/downloader/constants";

import {
        PUBLICATION_DOWNLOAD_FINISHED,
        PUBLICATION_DOWNLOAD_PROGRESS,
} from "readium-desktop/events/ipc";

import { BrowserWindow } from "electron";

export function* watchDownloadFinish(): SagaIterator {
    while (true) {
        const finishAction = yield take(DOWNLOAD_FINISH);
        let windows = BrowserWindow.getAllWindows();
        for (let window of windows) {
            window.webContents.send(
                PUBLICATION_DOWNLOAD_FINISHED,
                {download: finishAction.download},
            );
        }
    }
}

export function* watchDownloadProgress(): SagaIterator {
    while (true) {

        const progressAction = yield take(DOWNLOAD_PROGRESS);
        let windows = BrowserWindow.getAllWindows();
        for (let window of windows) {
            window.webContents.send(
                PUBLICATION_DOWNLOAD_PROGRESS,
                {download: progressAction.download},
            );
        }
    }
}
