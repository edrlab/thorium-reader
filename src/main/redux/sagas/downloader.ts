// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { createWriteStream, promises as fsp } from "fs";
import { RequestInit } from "node-fetch";
import * as path from "path";
import { acceptedExtension } from "readium-desktop/common/extension";
import { ToastType } from "readium-desktop/common/models/toast";
import { downloadActions, toastActions } from "readium-desktop/common/redux/actions";
import {
    callTyped, forkTyped, putTyped, raceTyped,
} from "readium-desktop/common/redux/sagas/typed-saga";
import { IHttpGetResult } from "readium-desktop/common/utils/http";
import { diMainGet } from "readium-desktop/main/di";
import { createTempDir } from "readium-desktop/main/fs/path";
import { AbortSignal, httpGet } from "readium-desktop/main/network/http";
import { _APP_NAME } from "readium-desktop/preprocessor-directives";
import { mapGenerator } from "readium-desktop/utils/generator";
import { findExtWithMimeType } from "readium-desktop/utils/mimeTypes";
import { all, call, cancelled, delay, join, take } from "redux-saga/effects";
import * as stream from "stream";
import { cancel, FixedTask, SagaGenerator } from "typed-redux-saga";
import * as util from "util";

// Logger
const debug = debug_("readium-desktop:main#saga/downloader");

type TDownloaderChannel = () => IDownloadProgression;

export type IDownloaderLink = string | {
    href: string,
    type: string,
};

export function* downloader(linkHrefArray: IDownloaderLink[], href?: string): SagaGenerator<string[]> {

    const id = Number(new Date());

    debug("Downloader ID=", id);

    try {
        yield* putTyped(downloadActions.progress.build({
            downloadUrl: href || "",
            progress: 0,
            id,
            speed: 0,
            contentLengthHumanReadable: "",
        }));

        // redux-saga : use call to execute sagaGenerator tasked (forked)
        const pathArray = yield* callTyped(downloaderService, linkHrefArray, id, href);
        debug("filePath Array to return from downloader", pathArray);

        return pathArray;

    } catch (err) {

        debug(err.toString());

        const translate = diMainGet("translator").translate;

        yield* putTyped(toastActions.openRequest.build(
            ToastType.Error,
            translate("message.download.error", { title: path.basename(href), err: `[${err}]` }),
        ));

        return [];

    } finally {

        if (yield cancelled()) {

            yield* putTyped(toastActions.openRequest.build(
                ToastType.Success,
                "cancelled", // TODO translate
            ));
        }

        debug("download service closed for", id, href);
        yield* putTyped(downloadActions.done.build(id));
    }
}

function* downloaderServiceProcessTaskStreamPipeline(task: FixedTask<TReturnDownloadLinkStream>) {

    yield join(task);

    const data = task.isCancelled() ? undefined : task.result<TReturnDownloadLinkStream>();

    if (data) {
        const [, , streamPipelinePromise] = data;

        yield call(async () => streamPipelinePromise);
    }
}

function* downloaderServiceProcessChannelProgressLoop(
    tasks: Array<FixedTask<TReturnDownloadLinkStream>>,
    id: number,
    href?: string,
) {

    let previousProgress = 0;
    let contentLengthTotal = 0;
    while (1) {

        const taskData = tasks.map(
            (task) => task.isCancelled() ? undefined : task.result<TReturnDownloadLinkStream>(),
        );

        let contentLengthProgress = 0;
        let progress = 0;
        let speed = 0;

        const nbTasks = taskData.filter((v) => v).length;
        debug("number of downloadTask:", nbTasks);

        for (const data of taskData) {

            if (data) {

                const [, channel] = data;

                const status = channel();

                if (status) {
                    progress += status.contentLength / status.progression;
                    speed += (status.speed || 0);
                    contentLengthProgress += status.contentLength;
                }

            }
        }

        if (contentLengthTotal < contentLengthProgress) {
            contentLengthTotal = contentLengthProgress;
        }
        progress = Math.ceil(contentLengthTotal / progress) || 0;

        if (previousProgress !== progress) {
            previousProgress = progress;

            yield* putTyped(downloadActions.progress.build({
                downloadUrl: href || "",
                progress,
                id,
                speed,
                contentLengthHumanReadable: humanFileSize(contentLengthTotal),
            }));

        }

        yield delay(200);
    }
}

function* downloaderService(linkHrefArray: IDownloaderLink[], id: number, href?: string): SagaGenerator<string[]> {

    const downloadProcessEffects = linkHrefArray.map((linkHref) => {
        return forkTyped(downloadLinkProcess, linkHref, id);
    });
    const downloadProcessTasks = yield* mapGenerator(downloadProcessEffects);

    const streamPipelineEffects = downloadProcessTasks.map((task) => {
        return forkTyped(downloaderServiceProcessTaskStreamPipeline, task);
    });

    const streamPipelineTasks = yield* mapGenerator(streamPipelineEffects);

    yield* raceTyped([
        call(function*() {

            yield take(downloadActions.abort.ID);

            yield all([
                cancel(downloadProcessTasks),
                cancel(streamPipelineTasks),
            ]);
        }),
        call(downloaderServiceProcessChannelProgressLoop, downloadProcessTasks, id, href),
        join(streamPipelineTasks),
    ]);

    const filesPathArray = downloadProcessTasks
        .map((t) => t.isCancelled() ? undefined : t.result<TReturnDownloadLinkStream>())
        .map((downloadData) => downloadData ? downloadData[0] : undefined);

    debug("downloaderService filesPath:", filesPathArray);
    return filesPathArray;
}

function* downloadLinkRequest(linkHref: string, abort: AbortSignal): SagaGenerator<IHttpGetResult<undefined>> {

    const options: RequestInit = {};
    options.signal = abort;

    const data = yield* callTyped(() => httpGet(linkHref, options));

    return data;
}

function* downloadCreatePathFilename(pathDir: string, filename: string, rc = 0): SagaGenerator<string> {

    const pathFile = path.resolve(pathDir, filename);
    debug("PathFile", pathFile);
    if (rc > 10) {
        throw new Error("Error to create the filePath in download directory " + pathFile);
    }

    let pathFileIsntCreated = false;
    try {
        yield call(() => fsp.access(pathFile));

    } catch {
        pathFileIsntCreated = true;
    }

    if (pathFileIsntCreated) {
        return pathFile;
    } else {
        filename = path.basename(filename, path.extname(filename)) +
            "_" +
            Math.round(Math.random() * 1000) +
            path.extname(filename);

        // recursion
        return yield* downloadCreatePathFilename(pathDir, filename, rc + 1);
    }
}

function downloadCreateFilename(contentType: string, contentDisposition: string, type?: string): string {

    const defExt = "unknown-ext";

    let filename = "file." + defExt;

    if (type) {
        contentType = type;
    }
    if (contentType) {
        const typeValues = contentType.replace(/\s/g, "").split(";");
        const [ext] = typeValues.map((v) => findExtWithMimeType(v)).filter((v) => v);
        if (ext) {
            filename = "file." + ext;
            return filename;
        }
    }
    if (contentDisposition) {
        const res = /filename=(\"(.*)\"|(.*))/g.exec(contentDisposition);
        const filenameInCD = res ? res[2] || res[3] || "" : "";
        if (acceptedExtension(path.extname(filenameInCD))) {
            filename = filenameInCD;
            return filename;
        }
    }

    return filename;
}

interface IDownloadProgression {
    speed: number;
    progression: number;
    contentLength: number;
}
function downloadReadStreamProgression(readStream: NodeJS.ReadableStream, contentLength: number) {

    let downloadedLength: number = 0;
    let downloadedSpeed: number = 0;
    let speed: number = 0;
    let pct = 0;

    const ev = <T = any>(cb: (emit: (data: T) => void) => void) => {
        let _data: T;

        cb((data: T) => {
            _data = data;
        });

        return () => {
            return _data;
        };
    };

    const channel: TDownloaderChannel = ev(
        (emit) => {

            const iv = setInterval(() => {

                speed = downloadedSpeed / 1024;
                pct = Math.ceil(downloadedLength / contentLength * 100);
                debug("speed: ", speed, "kb/s", "pct: ", pct, "%");

                emit({
                    speed,
                    progression: pct,
                    contentLength,
                });

                downloadedSpeed = 0;

            }, 1000);

            readStream.on("end", () => {
                debug("ReadStream end");

                clearInterval(iv);

                pct = 100;
                speed = 0;

                emit({
                    speed,
                    progression: pct,
                    contentLength,
                });
            });

        },
        // buffers.sliding(1),
    );

    readStream.on("data", (chunk: Buffer) => {

        downloadedSpeed += chunk.length;
        downloadedLength += chunk.length;
    });

    readStream.on("close", () => {
        debug("ReadStream close");
    });

    return channel;
}

type TReturnDownloadLinkStream = [
    string,
    TDownloaderChannel,
    Promise<void>,
    number,
];
function* downloadLinkStream(data: IHttpGetResult<undefined>, id: number, type?: string)
    : SagaGenerator<TReturnDownloadLinkStream> {

    if (data?.isSuccess) {

        // const url = data.responseUrl;
        const contentType = data.contentType;
        const contentDisposition = data.response.headers.get("content-disposition") || "";
        const contentLengthStr = data.response.headers.get("content-length") || "";
        const contentLength = parseInt(contentLengthStr, 10) || 0;
        const readStream = data.body;

        const filename = downloadCreateFilename(contentType, contentDisposition, type);
        debug("Filename", filename);

        const pathDir = yield* callTyped(createTempDir, id.toString());
        const pathFile = yield* callTyped(downloadCreatePathFilename, pathDir, filename);
        debug("PathFile", pathFile);

        if (readStream) {

            debug("filename doesn't exists, great!");
            const writeStream = createWriteStream(pathFile);
            const pipeline = util.promisify(stream.pipeline);

            const channel = downloadReadStreamProgression(readStream, contentLength);
            const pipelinePromise = pipeline(
                readStream,
                writeStream,
            );

            return [
                pathFile,
                channel,
                pipelinePromise,
                contentLength,
            ] as TReturnDownloadLinkStream;

        } else {

            debug("readStream not available");
            throw new Error("readStream not available");
        }

    } else {

        debug("httpGet ERROR", data?.statusMessage, data?.statusCode);
        throw new Error("http GET: " + data?.statusMessage + " (" + data?.statusCode + ")" + " [" + data.url + "]");
    }
}

type TReturnDownloadLinkProcess = TReturnDownloadLinkStream | undefined;
function* downloadLinkProcess(linkHref: IDownloaderLink, id: number): SagaGenerator<TReturnDownloadLinkProcess> {

    if (linkHref) {

        const abort = new AbortSignal();

        try {

            debug("start to downloadService", linkHref);
            const url = typeof linkHref === "string" ? linkHref : linkHref.href;
            const type = typeof linkHref === "string" ? undefined : linkHref.type;
            const httpData = yield* callTyped(downloadLinkRequest, url, abort);

            debug("start to stream download");
            return yield* callTyped(downloadLinkStream, httpData, id, type);

        } finally {

            debug("downloaderService finally");

            if (yield cancelled()) {
                debug("downloaderService cancelled -> abort");

                abort.dispatchEvent();
            }

        }
    }

    return undefined;
}

// -------------------- UTILS ----------------------

function humanFileSize(bytes: number, si = false, dp = 1) {
    const thresh = si ? 1000 : 1024;

    if (Math.abs(bytes) < thresh) {
        return bytes + " B";
    }

    const units = si
        ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
        : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
    let u = -1;
    const r = 10 ** dp;

    do {
        bytes /= thresh;
        ++u;
    } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);

    return bytes.toFixed(dp) + " " + units[u];
}
