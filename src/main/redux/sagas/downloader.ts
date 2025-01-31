// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { createWriteStream, promises as fsp, WriteStream } from "fs";
import * as path from "path";
import { acceptedExtension } from "readium-desktop/common/extension";
import { ToastType } from "readium-desktop/common/models/toast";
import { authActions, downloadActions, toastActions } from "readium-desktop/common/redux/actions";
import { ok } from "readium-desktop/common/utils/assert";
import { IHttpGetResult, THttpOptions } from "readium-desktop/common/utils/http";
import { createTempDir } from "readium-desktop/main/fs/path";
import { httpGet } from "readium-desktop/main/network/http";
import { findExtWithMimeType } from "readium-desktop/utils/mimeTypes";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { cancel, cancelled, delay, take } from "redux-saga/effects";
import { FixedTask, SagaGenerator } from "typed-redux-saga";
import {
    call as callTyped, flush as flushTyped, fork as forkTyped, join as joinTyped, put as putTyped,
    race as raceTyped, take as takeTyped,
} from "typed-redux-saga/macro";

import { Channel, channel, eventChannel } from "@redux-saga/core";
import { getTranslator } from "readium-desktop/common/services/translator";
import { contentTypeisOpdsAuth, parseContentType } from "readium-desktop/utils/contentType";
import { getOpdsAuthenticationChannel } from "readium-desktop/main/event";
import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import { OPDSAuthenticationDoc } from "@r2-opds-js/opds/opds2/opds2-authentication-doc";

// Logger
const debug = debug_("readium-desktop:main#saga/downloader");

type TDownloaderChannel = () => IDownloadProgression;

export type IDownloaderLink = string | {
    href: string,
    type: string,
};

export function* downloader(linkHrefArray: IDownloaderLink[], downloadLabel?: string): SagaGenerator<string[]> {

    const id = Number(new Date());

    debug("Downloader ID=", id);

    try {
        yield* putTyped(downloadActions.progress.build({
            downloadLabel: downloadLabel || "",
            downloadUrls: linkHrefArray.map((item) => typeof item === "string" ? item : item.href),
            progress: 0,
            id,
            speed: 0,
            contentLengthHumanReadable: "",
        }));

        // redux-saga : use call to execute sagaGenerator tasked (forked)
        const pathArray = yield* callTyped(downloaderService, linkHrefArray, id);
        debug("filePath Array to return from downloader", pathArray);

        return pathArray;

    } catch (err) {

        debug(err.toString());

        const translate = getTranslator().translate;

        yield* putTyped(toastActions.openRequest.build(
            ToastType.Error,
            translate("message.download.error", { title: downloadLabel, err: `[${err}]` }),
        ));

        return [];

    } finally {

        if (yield cancelled()) {

            yield* putTyped(toastActions.openRequest.build(
                ToastType.Success,
                "cancelled", // TODO translate
            ));
        }

        debug("download service closed for", id, downloadLabel);
        yield* putTyped(downloadActions.done.build(id));
    }
}

function* downloaderService(linkHrefArray: IDownloaderLink[], id: number): SagaGenerator<Array<string | undefined>> {

    const statusTaskChannel = (yield* callTyped(channel)) as Channel<TDownloaderChannel>;

    const downloadProcessTasks: FixedTask<string | undefined>[] = [];
    for (const linkHref of linkHrefArray) {
        const f = yield* forkTyped(downloaderServiceDownloadProcessTask, statusTaskChannel, linkHref, id);
        downloadProcessTasks.push(f);
    }

    yield* raceTyped([
        callTyped(function*() {

            while (true) {
                const action = yield* takeTyped(downloadActions.abort.build); // not .ID because we need Action return type
                if (action.payload.id === id) {
                    debug("cancel id (", id, ") with ", downloadProcessTasks.length, "tasks");
                    yield cancel(downloadProcessTasks);
                } else {
                    debug("cancel id (", id, ") mismatch with ", action.payload.id);
                }
            }
        }),
        callTyped(downloaderServiceProcessStatusProgressLoop, statusTaskChannel, id),
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
    writeStream.on("finish", () => {
        debug("WriteStream finish");
    });
    writeStream.on("close", () => {
        debug("WriteStream close");
    });
    writeStream.on("error", () => {
        debug("WriteStream error");
    });

    yield* callTyped(downloaderServiceProcessTaskStreamPipeline, readStream, writeStream);

    return pathFile;
}

function* downloaderServiceProcessTaskStreamPipeline(readStream: NodeJS.ReadStream, writeStream: WriteStream): SagaGenerator<void> {

    if (!readStream || !writeStream) return;

    readStream.pipe(writeStream);

    const chan = eventChannel((emit) => {
        const f = () => emit(0);

        // when 'read' stream finishes,
        // 'write' stream may not have finished
        // flushing its filesystem buffers yet!

        // readStream.on("end", f);
        // readStream.on("close", f);
        readStream.on("error", f);

        writeStream.on("finish", f);
        writeStream.on("close", f);
        writeStream.on("error", f);

        return () => {

            debug("DESTROY FROM CHANNEL");

            readStream.destroy();

            // readStream.off("end", f);
            // readStream.off("close", f);
            readStream.off("error", f);

            writeStream.off("finish", f);
            writeStream.off("close", f);
            writeStream.off("error", f);
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
) {

    let previousProgress = 0;
    let previousDownloadedLength = 0;
    let contentLengthTotal = 0;
    const channelList: TDownloaderChannel[] = [];
    while (1) {

        let contentLengthProgress = 0;
        let downloadedLength = 0;
        let progress = 0;
        let speed = 0;

        const chan = yield* flushTyped(statusTasksChannel);
        channelList.push(...chan);

        const statusList = yield* callTyped(() => channelList.map((v) => v ? v() : undefined));
        // const nbTasks = statusList.filter((v) => v).length;
        // debug("number of downloadTask for id (", id, "):", nbTasks);

        for (const status of statusList) {
            if (status) {
                progress += status.contentLength / status.progression;
                speed += (status.speed || 0);
                contentLengthProgress += status.contentLength;
                downloadedLength += status.downloadedLength;
            }
        }

        if (contentLengthTotal < contentLengthProgress) {
            contentLengthTotal = contentLengthProgress;
        }
        progress = Math.ceil(contentLengthTotal / progress) || 0;

        if (previousProgress !== progress || previousDownloadedLength !== downloadedLength) {
            previousProgress = progress;
            previousDownloadedLength = downloadedLength;

            const downloadLabel = statusList.filter((i) => !!i).reduce((prev, cur) => {
                return `${prev ? `${prev} ` : ""}[${cur.filename}]`;
            }, "");
            const MAX_STR = 50;
            yield* putTyped(downloadActions.progress.build({
                downloadLabel: downloadLabel.length > MAX_STR ? (downloadLabel.substring(0, MAX_STR) + "...") : downloadLabel,
                downloadUrls: statusList.filter((i) => !!i).map((item) => item.url),
                progress,
                id,
                speed,
                contentLengthHumanReadable: humanFileSize(!contentLengthTotal ? downloadedLength : contentLengthTotal),
            }));

        }

        yield delay(200);
    }
}

function* downloadLinkRequest(linkHref: string, controller: AbortController): SagaGenerator<IHttpGetResult<undefined>> {

    const options: THttpOptions = {};
    options.abortController = controller;
    options.signal = controller.signal;

    const data = yield* callTyped(() => httpGet(linkHref, options));

    const type = data.contentType;
    const contentType = parseContentType(type);

    const isAuth = contentTypeisOpdsAuth(contentType);
    if (isAuth) {

        const jsonObj = yield* callTyped(() => data.response.json());

        const r2OpdsAuth = TaJsonDeserialize(
            jsonObj,
            OPDSAuthenticationDoc,
        );

        const opdsAuthChannel = getOpdsAuthenticationChannel();

        debug("put the authentication model in the saga authChannel", JSON.stringify(r2OpdsAuth, null, 4));
        opdsAuthChannel.put([r2OpdsAuth, linkHref]);

        const {cancel} = yield* raceTyped({
            cancel: takeTyped(authActions.cancel.build),
            done: takeTyped(authActions.done.build),
        });
        debug("authentication modal closed");

        if (cancel) {
            controller.abort();
            return data;
        }
        debug("relaunch the download of the publication");
        return yield* callTyped(downloadLinkRequest, linkHref, controller);
    }

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

    const filename = "file." + defExt;

    let contentTypeFilename = "";
    // type href link from opds feed take precedence on http header content-type !?!
    if (type) {
        contentType = type;
    }
    if (contentType) {
        const typeValues = contentType.replace(/\s/g, "").split(";");
        const [ext] = typeValues.map((v) => findExtWithMimeType(v)).filter((v) => v);
        if (ext) {
            contentTypeFilename = "file." + ext;
        }
    }

    // example
    // "attachment; filename=xxx.epub; filename*=UTF-8''xxx.epub"
    let contentDispositionFilename = "";
    if (contentDisposition) {
        const res = /filename=(\"([^;]+)\"|([^;]+))/.exec(contentDisposition);
        const filenameInCD = res ? res[2] || res[3] || "" : "";
        if (acceptedExtension(path.extname(filenameInCD))) {
            contentDispositionFilename = filenameInCD;
            debug(`contentDispositionFilename: ${contentDispositionFilename}`);
        }
    }
    if (contentDisposition && !contentDispositionFilename) {
        const res = /filename\*=UTF-8''(\"([^;]+)\"|([^;]+))/.exec(contentDisposition);
        const filenameInCD = decodeURIComponent(res ? res[2] || res[3] || "" : "");
        if (acceptedExtension(path.extname(filenameInCD))) {
            contentDispositionFilename = filenameInCD;
            debug(`contentDispositionFilename UTF8: ${contentDispositionFilename}`);
        }
    }

    if (contentDispositionFilename &&
        path.extname(contentDispositionFilename).toLowerCase() === path.extname(contentTypeFilename).toLowerCase()
    ) {
        debug("contentType and contentDisposition have the same extension ! Good catch !", contentTypeFilename, contentDispositionFilename);
    } else {
        debug("contentType and contentDisposition does not have the same extension ! Server stream !?!", contentTypeFilename, contentDispositionFilename);
    }

    return contentDispositionFilename || contentTypeFilename || filename;
}

interface IDownloadProgression {
    speed: number;
    progression: number;
    downloadedLength: number;
    contentLength: number;
    filename: string;
    url: string,
}
function downloadReadStreamProgression(readStream: NodeJS.ReadableStream, contentLength: number, filename: string, url: string) {

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
                // contentLength can be zero (unfortunately), pct is Infinity :(
                // debug("downloadedLength: ", downloadedLength, "contentLength: ", contentLength);
                pct = Math.ceil(downloadedLength / contentLength * 100);
                debug("speed: ", speed, "kb/s", "pct: ", pct, "%");

                emit({
                    speed,
                    progression: pct,
                    downloadedLength,
                    contentLength,
                    filename,
                    url,
                });

                downloadedSpeed = 0;

            }, 1000);

            readStream.on("end", () => {
                debug("ReadStream end _");

                clearInterval(iv);

                pct = 100;
                speed = 0;

                emit({
                    speed,
                    progression: pct,
                    downloadedLength,
                    contentLength,
                    filename,
                    url,
                });
            });

            readStream.on("close", () => {
                debug("ReadStream close _");
                clearInterval(iv);
            });

            readStream.on("error", () => {
                debug("ReadStream error _");
                clearInterval(iv);
            });
        },
        // buffers.sliding(1),
    );

    readStream.on("data", (chunk: Buffer) => {

        downloadedSpeed += chunk.length;
        downloadedLength += chunk.length;
    });

    readStream.on("end", () => {
        debug("ReadStream end");
    });
    readStream.on("close", () => {
        debug("ReadStream close");
    });
    readStream.on("error", () => {
        debug("ReadStream error");
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

    const channel = downloadReadStreamProgression(readStream, contentLength, filename, typeof data.url === "string" ? data.url : data.url.toString());

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

    const controller = new AbortController();

    try {

        debug("start to downloadService", linkHref);
        const url = typeof linkHref === "string" ? linkHref : linkHref.href;
        const type = typeof linkHref === "string" ? undefined : linkHref.type;
        const httpData = yield* callTyped(downloadLinkRequest, url, controller);

        debug("start to stream download");
        return yield* callTyped(downloadLinkStream, httpData, id, type);

    } finally {

        debug("downloaderService finally");

        if (yield cancelled()) {
            debug("downloaderService cancelled -> abort");

            controller.abort();
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
