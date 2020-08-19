// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { createWriteStream, promises as fsp } from "fs";
import { RequestInit } from "node-fetch";
import { tmpdir } from "os";
import * as path from "path";
import { acceptedExtension } from "readium-desktop/common/extension";
import { ToastType } from "readium-desktop/common/models/toast";
import { downloadActions, toastActions } from "readium-desktop/common/redux/actions";
import {
    allTyped, callTyped, forkTyped, joinTyped, putTyped, raceTyped, takeTyped,
} from "readium-desktop/common/redux/sagas/typed-saga";
import { AccessTokenMap } from "readium-desktop/common/redux/states/catalog";
import { IHttpGetResult } from "readium-desktop/common/utils/http";
import { diMainGet } from "readium-desktop/main/di";
import { AbortSignal, httpGet } from "readium-desktop/main/http";
import { _APP_NAME } from "readium-desktop/preprocessor-directives";
import { findExtWithMimeType } from "readium-desktop/utils/mimeTypes";
import { END, eventChannel } from "redux-saga";
import { call, cancelled, take } from "redux-saga/effects";
import * as stream from "stream";
import { cancel, FixedTask, put, SagaGenerator } from "typed-redux-saga";
import * as util from "util";

// Logger
const debug = debug_("readium-desktop:main#saga/downloader");

export function* downloader(linkHrefArray: string[], href?: string): SagaGenerator<string[]> {

    const id = Number(new Date());

    debug("Downloader ID=", id);

    try {
        yield* putTyped(downloadActions.progress.build({
            downloadUrl: href,
            progress: 0,
            id,
            speed: 0,
            contentLengthHumanReadable: "",
        }));

        // redux-saga : use call to execute sagaGenerator tasked (forked)
        const pathArray = yield* callTyped(downloaderService, linkHrefArray, Number(new Date()), href);
        debug("filePath Array to return from downloader", pathArray);
        return pathArray;

    } catch (err) {

        debug("Error from Downloader", err);

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

        yield* putTyped(downloadActions.done.build(id));
    }
}

function* downloaderService(linkHrefArray: string[], id: number, href?: string): SagaGenerator<string[]> {

    const effects = linkHrefArray.map((ln) => {
        return forkTyped(function*() {

            const abort = new AbortSignal();
            try {

                if (!ln) {
                    return undefined;
                }

                debug("start to downloadService", ln);
                const data = yield* downloadLinkRequest(ln, abort);

                debug("start to stream download");
                const pathFile = yield* downloadLinkStream(data, id, href);

                debug("pathFile to return", pathFile);
                return pathFile;

            } catch (err) {

                debug("Error from downloaderService", err);

                throw err;

            } finally {

                debug("downloaderService finally");

                if (yield cancelled()) {
                    debug("downloaderService cancelled -> abort");

                    abort.dispatchEvent();
                }

            }

        });
    });

    const tasks: Array<FixedTask<string>> = [];
    for (const e of effects) {
        const res = yield* e;
        tasks.push(res);
    }

    yield* raceTyped({
        abort: call(function*() {

            yield take(downloadActions.abort.ID);

            yield cancel(tasks);
        }),
        join: joinTyped(tasks),
    });

    const hrefArray = tasks.map((t) => t.isCancelled() ? undefined : t.result<string | undefined>());

    debug("download path:", hrefArray);
    return hrefArray;
}

function* downloadLinkRequest(linkHref: string, abort: AbortSignal): SagaGenerator<IHttpGetResult<undefined>> {

    let savedAccessTokens: AccessTokenMap = {};
    try {
        // Why is this undefined?? Injection async problem?
        const configRepository = diMainGet("config-repository");
        const configDoc = yield* callTyped(() => configRepository.get("oauth"));
        savedAccessTokens = configDoc.value;
    } catch (err) {
        debug("Error to get oauth config value");
        debug(err);
    }
    const domain = linkHref.replace(/^https?:\/\/([^\/]+)\/?.*$/, "$1");
    const accessToken = savedAccessTokens ? savedAccessTokens[domain] : undefined;

    const options: RequestInit = {};
    options.signal = abort;

    if (accessToken) {
        options.headers = {
            Authorization: `Bearer ${accessToken.authenticationToken}`,
        };
        debug("new header with oauth", options.headers);
    }

    const data = yield* callTyped(() => httpGet(linkHref, options));

    return data;
}

function* downloadCreatePathDir(id: string): SagaGenerator<string | undefined> {
    // /tmp/thorium/download/{unixtimestamp}/name.ext

    const tmpDir = tmpdir();
    let pathDir = tmpDir;
    try {
        pathDir = path.resolve(tmpDir, _APP_NAME.toLowerCase(), "download", id);
        yield call(() => fsp.mkdir(pathDir, { recursive: true }));

    } catch (err) {
        debug(err, err.trace);

        try {
            pathDir = path.resolve(tmpDir, id.toString());
            yield call(() => fsp.mkdir(pathDir));
        } catch (err) {
            debug(err, err.trace, err.code);

            if (err.code !== "EEXIST") {

                throw new Error("Error to create directory: " + pathDir);
            }

        }
    }
    return pathDir;
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

function downloadCreateFilename(contentType: string, contentDisposition: string): string {

    const defExt = "unknown-ext";

    let filename = "file." + defExt;
    if (contentDisposition) {
        const res = /filename=(\"(.*)\"|(.*))/g.exec(contentDisposition);
        const filenameInCD = res ? res[2] || res[3] || "" : "";
        if (acceptedExtension(path.extname(filenameInCD))) {
            filename = filenameInCD;
            return filename;
        }
    }
    if (contentType) {
        const typeValues = contentType.replace(/\s/g, "").split(";");
        let [ext] = typeValues.map((v) => findExtWithMimeType(v)).filter((v) => v);
        if (!ext) {
            ext = defExt;
        }
        filename = "file." + ext;
    }

    return filename;
}

function downloadReadStreamProgression(readStream: NodeJS.ReadableStream, contentLength: number) {

    let downloadedLength: number = 0;
    let downloadedSpeed: number = 0;
    let speed: number = 0;
    let pct = 0;

    const channel = eventChannel<{speed: number, progression: number}>(
        (emit) => {

            const iv = setInterval(() => {

                speed = downloadedSpeed / 1024;
                pct = Math.ceil(downloadedLength / contentLength * 100);
                debug("speed: ", speed, "kb/s", "pct: ", pct, "%");

                emit({
                    speed,
                    progression: pct,
                });

                downloadedSpeed = 0;

            }, 1000);

            readStream.on("end", () => {
                debug("ReadStream end");

                emit(END);
            });

            return () => {
                clearInterval(iv);

                pct = 100;
                speed = 0;
            };
        },
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

function* downloadLinkStream(data: IHttpGetResult<undefined>, id: number, href?: string): SagaGenerator<string> {

    if (data?.isSuccess) {

        // const url = data.responseUrl;
        const contentType = data.contentType;
        const contentDisposition = data.response.headers.get("content-disposition") || "";
        const contentLengthStr = data.response.headers.get("content-length") || "";
        const contentLength = parseInt(contentLengthStr, 10) || 0;
        const readStream = data.body;
        const contentLengthHumanReadable = humanFileSize(contentLength);
        debug("contentLength", contentLengthHumanReadable);

        const filename = downloadCreateFilename(contentType, contentDisposition);
        debug("Filename", filename);

        const pathDir = yield* downloadCreatePathDir(id.toString());
        const pathFile = yield* downloadCreatePathFilename(pathDir, filename);
        debug("PathFile", pathFile);

        if (readStream) {

            yield* putTyped(downloadActions.progress.build({
                downloadUrl: href,
                progress: 0,
                id,
                speed: 0,
                contentLengthHumanReadable,
            }));

            debug("filename doesn't exists, great!");
            const writeStream = createWriteStream(pathFile);
            const pipeline = util.promisify(stream.pipeline);

            const channel = downloadReadStreamProgression(readStream, contentLength);

            yield* allTyped([
                call(() => pipeline(
                    readStream,
                    writeStream,
                )),
                call(function*() {

                    try {

                        while (true) {

                            const status = yield* takeTyped(channel);

                            yield put(downloadActions.progress.build({
                                downloadUrl: href,
                                progress: status.progression,
                                id,
                                speed: status.speed,
                                contentLengthHumanReadable,
                            }));
                        }

                    } finally {
                        // ignore
                    }
                }),
            ]);

            yield* putTyped(downloadActions.progress.build({
                downloadUrl: href,
                progress: 100,
                id,
                speed: 0,
                contentLengthHumanReadable,
            }));

            return pathFile;
        } else {
            debug("readStream not available");
            throw new Error("readStream not available");
        }

    } else {
        debug("httpGet ERROR", data?.statusMessage, data?.statusCode);
        throw new Error("http GET: " + data?.statusMessage + " (" + data?.statusCode + ")");
    }
}

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
