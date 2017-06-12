import * as fs from "fs";
import { channel, SagaIterator } from "redux-saga";
import { call, fork, put, take } from "redux-saga/effects";
import * as request from "request";

import { DOWNLOAD_ADD } from "readium-desktop/downloader/constants";

import * as downloaderActions from "readium-desktop/actions/downloader";
import { Download } from "readium-desktop/models/download";

function downloadContent(download: Download, chan: any) {
    return request
        .get(download.srcUrl)
        .on("response", (response: any) => {
            if (response.statusCode < 200 || response.statusCode > 299) {
                // Unable to download the resource
                chan.put({
                    error: true,
                    msg: "Bad status code: " + response.statusCode,
                });
            }

            const totalSize: number = response.headers["content-length"];
            let downloadedSize: number = 0;

            response.on("data", (chunk: any) => {
                // Download progress
                downloadedSize += chunk.length;
                chan.put({
                    error: false,
                    progress: Math.round((downloadedSize / totalSize) * 100),
                });
            });

            response.on("end", () => {
                // Download finished
                chan.put({
                    error: false,
                    progress: 100,
                });
            });
        })
        .on("error", (error: any) => {
            // Download error
            chan.put({
                error: true,
                msg: "Error code: " + error.code,
            });
        })
        .pipe(fs.createWriteStream(download.dstPath));
}

function* startDownload(download: Download) {
    const chan = yield call(channel);
    yield put(downloaderActions.start(download));
    yield fork(downloadContent, download, chan);

    let progress: number = 0;

    while (progress < 100) {
        const payload = yield take(chan);
        const error = payload.error;

        if (error) {
            yield put(downloaderActions.fail(download, payload.msg));
            return;
        } else {
            progress = payload.progress;
            yield put(downloaderActions.progress(download, progress));
        }
    }

    yield put(downloaderActions.finish(download));
}

export function* watchDownloadStart(): SagaIterator {
    while (true) {
        const addAction = yield take(DOWNLOAD_ADD);
        yield fork(startDownload, addAction.download);
        // const task = yield fork(startDownload, addAction.download);

        /*const stopAction = yield take([DOWNLOAD_CANCEL, DOWNLOAD_FAIL]);

        if (stopAction.type === DOWNLOAD_CANCEL) {
            yield cancel(task);
        }*/
    }
}
