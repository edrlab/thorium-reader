// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { createWriteStream, promises as fsp, WriteStream } from "fs";
import { RequestInit } from "node-fetch";
import * as path from "path";
import { acceptedExtension } from "readium-desktop/common/extension";
import { ToastType } from "readium-desktop/common/models/toast";
import { downloadActions, toastActions } from "readium-desktop/common/redux/actions";
import { ok } from "readium-desktop/common/utils/assert";
import { IHttpGetResult } from "readium-desktop/common/utils/http";
import { diMainGet } from "readium-desktop/main/di";
import { createTempDir } from "readium-desktop/main/fs/path";
import { AbortSignal, httpGet } from "readium-desktop/main/network/http";
import { findExtWithMimeType } from "readium-desktop/utils/mimeTypes";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { cancel, cancelled, delay, take } from "redux-saga/effects";
import { FixedTask, SagaGenerator } from "typed-redux-saga";
import {
    call as callTyped, flush as flushTyped, fork as forkTyped, join as joinTyped, put as putTyped,
    race as raceTyped,
} from "typed-redux-saga/macro";

import { Channel, channel, eventChannel } from "@redux-saga/core";

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

function* downloaderService(linkHrefArray: IDownloaderLink[], id: number, href?: string): SagaGenerator<Array<string | undefined>> {

    const statusTaskChannel = (yield* callTyped(channel)) as Channel<TDownloaderChannel>;

    const downloadProcessTasks: FixedTask<string | undefined>[] = [];
    for (const linkHref of linkHrefArray) {
        const f = yield* forkTyped(downloaderServiceDownloadProcessTask, statusTaskChannel, linkHref, id);
        downloadProcessTasks.push(f);
    }

    yield* raceTyped([
        callTyped(function*() {

            yield take(downloadActions.abort.ID);
            yield cancel(downloadProcessTasks);
        }),
        callTyped(downloaderServiceProcessStatusProgressLoop, statusTaskChannel, id, href),
        joinTyped(downloadProcessTasks),
    ]);

    const filesPathArray = downloadProcessTasks
        .map((t) => t.isCancelled() ? undefined : t.result());

    debug("downloaderService filesPath:", filesPathArray);
    return filesPathArray;
}

function* downloaderServiceDownloadProcessTask(chan: Channel<TDownloaderChannel>, linkHref: IDownloaderLink, id?: number): SagaGenerator<string | undefined> {

    if (!linkHref) return undefined;

    const [pathFile, channel, readStream] = yield* callTyped(downloadLinkProcess, linkHref, id);
    if (channel) yield* putTyped(chan, channel);
    const writeStream = createWriteStream(pathFile);
    yield* callTyped(downloaderServiceProcessTaskStreamPipeline, readStream, writeStream);

    return pathFile;
}

function* downloaderServiceProcessTaskStreamPipeline(readStream: NodeJS.ReadStream, writeStream: WriteStream): SagaGenerator<void> {

    if (!readStream || !writeStream) return;

    readStream.pipe(writeStream);
    const chan = eventChannel((emit) => {
        const f = () => emit(0);
        readStream.on("end", f);
        readStream.on("close", f);
        readStream.on("error", f);

        return () => {

            debug("DESTROY FROM CHANNEL");
            readStream.destroy();
            readStream.off("close", f);
            readStream.off("error", f);
            readStream.off("end", f);
        };
    });

    try {

        yield take(chan);
        debug("pipeline done");
    } finally {
        if (yield cancelled()) chan.close();
    }
}

function* downloaderServiceProcessStatusProgressLoop(
    statusTasksChannel: Channel<TDownloaderChannel>,
    id: number,
    href?: string,
) {

    let previousProgress = 0;
    let contentLengthTotal = 0;
    const channelList: TDownloaderChannel[] = [];
    while (1) {

        let contentLengthProgress = 0;
        let progress = 0;
        let speed = 0;

        const chan = yield* flushTyped(statusTasksChannel);
        channelList.push(...chan);

        const statusList = yield* callTyped(() => channelList.map((v) => v ? v() : undefined));
        const nbTasks = statusList.filter((v) => v).length;
        debug("number of downloadTask:", nbTasks);

        for (const status of statusList) {
            if (status) {
                progress += status.contentLength / status.progression;
                speed += (status.speed || 0);
                contentLengthProgress += status.contentLength;
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

function* downloadLinkRequest(linkHref: string, abort: AbortSignal): SagaGenerator<IHttpGetResult<undefined>> {

    const options: RequestInit = {};
    options.signal = abort;

    const data = yield* callTyped(() => httpGet(linkHref, options));

    return data;
}

function* downloadCreatePathFilename(pathDir: string, filename: string, rc = 0): SagaGenerator<string> {

    ok(typeof pathDir === "string");
    ok(typeof filename === "string");
    const pathFile = path.resolve(pathDir, filename);
    debug("PathFile", pathFile);

    ok(rc < 10, "Too many tries => " + pathFile);

    const pathFileExists = yield* callTyped(async () => {
        try {
            await fsp.access(pathFile);
            return true;
        } catch {
            return false;
        }
    });

    if (pathFileExists) {
        const filename2 = path.basename(filename, path.extname(filename)) +
            "_" +
            Math.round(Math.random() * 1000) +
            path.extname(filename);

        // recursion
        return yield* downloadCreatePathFilename(pathDir, filename2, rc + 1);
    }
    return pathFile;
}

function downloadCreateFilename(contentType: string | undefined, contentDisposition: string | undefined, type?: string): string {

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

    let downloadedLength = 0;
    let downloadedSpeed = 0;
    let speed = 0;
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

            readStream.on("close", () => {
                clearInterval(iv);
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
    pathFile: string,
    channelInfo: TDownloaderChannel,
    readStream: NodeJS.ReadStream,
    contentLength: number,
];
function* downloadLinkStream(data: IHttpGetResult<undefined>, id: number, type?: string)
    : SagaGenerator<TReturnDownloadLinkStream> {

    ok(data?.isSuccess, "http GET error: " + data?.statusMessage + " (" + data?.statusCode + ")" + " [" + data.url + "]");

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

    ok(readStream, "readStream not defined");

    const channel = downloadReadStreamProgression(readStream, contentLength);

    return [
        pathFile,
        channel,
        readStream,
        contentLength,
    ] as TReturnDownloadLinkStream;
}

type TReturnDownloadLinkProcess = TReturnDownloadLinkStream | undefined;
function* downloadLinkProcess(linkHref: IDownloaderLink, id: number): SagaGenerator<TReturnDownloadLinkProcess> {

    ok(linkHref);
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
