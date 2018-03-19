import * as fs from "fs";
import { Buffer, buffers, channel, SagaIterator } from "redux-saga";
import { actionChannel, call, cancel, fork, put, take } from "redux-saga/effects";
import * as request from "request";

import { Download } from "readium-desktop/common/models/download";
import { downloaderActions } from "readium-desktop/common/redux/actions";

function downloadContent(download: Download, chan: any) {
    // Do not pipe request directly to this stream to void blocking issues
    const outputStream = fs.createWriteStream(download.dstPath);

    // Last time we poll the request progress
    let progressLastTime = new Date();

    // 5 seconds of timeout
    const requestStream = request.get(
        download.srcUrl,
        {timeout: 5000},
    );

    requestStream.on("response", (response: any) => {
        if (response.statusCode < 200 || response.statusCode > 299) {
            // Unable to download the resource
            console.log("## downloadContent", "err");
            chan.put({
                error: true,
                msg: "Bad status code: " + response.statusCode,
            });
        }

        const totalSize: number = response.headers["content-length"];
        let downloadedSize: number = 0;

        // Progress in percent
        let progress: number = 0;

        response.on("data", (chunk: any) => {
            // Write chunk
            outputStream.write(chunk);

            // Download progress
            downloadedSize += chunk.length;
            const currentTime = new Date();
            const elapsedSeconds = (
                currentTime.getTime() -
                progressLastTime.getTime()
            ) / 1000;

            if (elapsedSeconds > 1) {
                // Refresh progress at best every 1 seconds
                progress = Math.round((downloadedSize / totalSize) * 100);
                chan.put({
                    error: false,
                    progress,
                });
                progressLastTime = currentTime;
            }
        });

        response.on("end", () => {
            outputStream.end();
            // Download finished
            chan.put({
                error: false,
                progress: 100,
            });
        });
    });

    // Catch errors
    requestStream.on("error", (error: any) => {
        // Download error
        outputStream.end();
        chan.put({
            error: true,
            msg: "Error code: " + error.code,
        });
    });
}

function* downloadContentWatcher(download: Download, chan: any): SagaIterator {
    let progress: number = 0;

    while (progress < 100) {
        const payload = yield take(chan);
        const error = payload.error;

        if (error) {
            yield put(downloaderActions.fail(download, payload.msg));
            return;
        } else {
            progress = payload.progress;

            // Do not refresh more than every seconds
            yield put(downloaderActions.progress(download, progress));
        }
    }

    yield put(downloaderActions.finish(download));
}

function* startDownload(download: Download): SagaIterator {
    const chan = yield call(channel);
    yield put(downloaderActions.start(download));
    const downloadContentWatcherTask = yield fork(downloadContentWatcher, download, chan);
    const downloadContentTask = yield fork(downloadContent, download, chan);

    while (true) {
        const action = yield take(downloaderActions.ActionType.CancelRequest);
        const canceledDownload = action.payload.download;

        if (canceledDownload.identifier === download.identifier) {
            // Close channel before killing tasks
            chan.close();

            // Cancel all tasks specific to the download
            yield cancel(downloadContentTask);
            yield cancel(downloadContentWatcherTask);
            yield put({
                type: downloaderActions.ActionType.CancelSuccess,
                payload: {
                    download,
                },
            });
        }
    }
}

export function* downloadAddRequestWatcher(): SagaIterator {
    while (true) {
        const action = yield take(downloaderActions.ActionType.AddRequest);
        const download = action.payload.download;
        yield fork(startDownload, download);
    }
}

export function* downloadPostProcessWatcher(): SagaIterator {
    while (true) {
        const action = yield take(downloaderActions.ActionType.PostProcess);
        const download = action.download;

        // Rename file
        const srcPath: string = download.dstPath;
        const dstPath: string = srcPath.substring(
            0,
            srcPath.lastIndexOf(".part"),
        );

        fs.renameSync(srcPath, dstPath);
        yield put(downloaderActions.finish(download));
    }
}
