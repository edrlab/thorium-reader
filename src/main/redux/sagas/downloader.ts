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
import { allTyped, callTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { AccessTokenMap } from "readium-desktop/common/redux/states/catalog";
import { IHttpGetResult } from "readium-desktop/common/utils/http";
import { diMainGet } from "readium-desktop/main/di";
import { httpGet } from "readium-desktop/main/http";
import { _APP_NAME } from "readium-desktop/preprocessor-directives";
import { findExtWithMimeType } from "readium-desktop/utils/mimeTypes";
import { call } from "redux-saga/effects";
import * as stream from "stream";
import { SagaGenerator } from "typed-redux-saga";
import * as util from "util";

// Logger
const debug = debug_("readium-desktop:main#saga/downloader");

export function* downloader(linkHrefArray: string[], title?: string): SagaGenerator<string[]> {

    const id = Number(new Date());

    debug("Downloader ID=", id);

    return yield* downloaderService(linkHrefArray, Number(new Date()), title);
}

function* downloaderService(linkHrefArray: string[], id: number, title?: string): SagaGenerator<string[]> {

    const effects = linkHrefArray.map((href) => {
        return call(function*() {

            debug("start to downloadService", href);
            const data = yield* downloadLinkRequest(href);

            debug("start to stream download");
            const pathFile = yield* downloadLinkStream(data, id, title);

            debug("pathFile to return", pathFile);
            return pathFile;
        });
    });

    const hrefArray = yield* allTyped(effects);
    return hrefArray;
}

function* downloadLinkRequest(linkHref: string): SagaGenerator<IHttpGetResult<undefined>> {

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

    const intervale = setInterval(() => {

        speed = downloadedSpeed / 1024;
        pct = Math.ceil(downloadedLength / contentLength * 100);
        debug("speed: ", speed, "kb/s", "pct: ", pct, "%");

        downloadedSpeed = 0;

    }, 1000);

    readStream.on("data", (chunk: Buffer) => {

        downloadedSpeed += chunk.length;
        downloadedLength += chunk.length;
    });

    readStream.on("end", () => {
        debug("ReadStream end");

        clearInterval(intervale);
        pct = 100;
        speed = 0;
    });

    readStream.on("close", () => {
        debug("ReadStream close");
    });
}

function* downloadLinkStream(data: IHttpGetResult<undefined>, id: number, _title?: string): SagaGenerator<string> {

    try {
        if (data?.isSuccess) {

            // const url = data.responseUrl;
            const contentType = data.contentType;
            const contentDisposition = data.response.headers.get("content-disposition") || "";
            const contentLengthStr = data.response.headers.get("content-length") || "";
            const contentLength = parseInt(contentLengthStr, 10) || 0;
            const readStream = data.body;

            const filename = downloadCreateFilename(contentType, contentDisposition);
            debug("Filename", filename);

            const pathDir = yield* downloadCreatePathDir(id.toString());
            const pathFile = yield* downloadCreatePathFilename(pathDir, filename);
            debug("PathFile", pathFile);

            if (readStream) {

                debug("filename doesn't exists, great!");
                const writeStream = createWriteStream(pathFile);
                const pipeline = util.promisify(stream.pipeline);

                debug("contentLength", humanFileSize(contentLength));
                downloadReadStreamProgression(readStream, contentLength);

                yield call(() => pipeline(
                    readStream,
                    writeStream,
                ));

                return pathFile;
            } else {
                debug("readStream not available");
            }

        } else {
            debug("httpGet ERROR", data?.statusMessage, data?.statusCode);
        }

    } catch (err) {
        // ignore

        debug(err, err.trace);
    }

    return undefined;
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
