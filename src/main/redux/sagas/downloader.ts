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

function* downloadLinkStream(data: IHttpGetResult<undefined>, id: number, _title?: string): SagaGenerator<string> {

    if (data) {
        if (data.isSuccess) {
            // const url = data.responseUrl;
            const contentType = data.contentType;
            const contentDisposition = data.response.headers.get("content-disposition");
            const contentLengthStr = data.response.headers.get("content-length");
            const contentLength = parseInt(contentLengthStr, 10) || 0;
            const readStream = data.body;

            let filename = "";
            if (contentDisposition) {
                const [, filenameInCD] = /filename="(.*)"/g.exec(contentDisposition);
                if (acceptedExtension(path.extname(filenameInCD))) {
                    filename = filenameInCD;
                }
            } else {
                const typeValues = contentType.replace(/\s/g, "").split(";");
                let [ext] = typeValues.map((v) => findExtWithMimeType(v)).filter((v) => v);
                if (!ext) {
                    ext = "unknown-ext";
                }
                filename = "file." + ext;
            }

            debug("Filename", filename);

            const tmpDir = tmpdir();
            // /tmp/thorium/download/{unixtimestamp}/name.ext
            const pathDir = path.resolve(tmpDir, _APP_NAME.toLowerCase(), "download", id.toString());
            yield call(() => fsp.mkdir(pathDir, { recursive: true }));

            const pathFile = path.resolve(pathDir, filename);
            debug("PathFile", pathFile);
            try {
                let fileExist = true;
                try {
                    yield call(() => fsp.access(pathFile));

                } catch {
                    fileExist = false;
                }

                if (!fileExist) {
                    debug("filename doesn't exists, great!");
                    const writeStream = createWriteStream(pathFile);
                    const pipeline = util.promisify(stream.pipeline);

                    debug("contentLength", contentLength);
                    let downloadedLength: number = 0;
                    readStream.on("data", (chunk: Buffer) => {

                        downloadedLength += chunk.length;
                        const pct = Math.ceil(downloadedLength / contentLength);
                        debug("Downloading", chunk.length, pct);
                    });

                    yield call(() => pipeline(
                        readStream,
                        writeStream,
                    ));

                } else {
                    debug("DOING SOMETHING");
                    debug("filename already exists, damn!");
                }

            } catch (err) {
                // ignore

                debug(err, err.trace);
            }
            return pathFile;
        } else {
            debug("httpGet ERROR", data.statusMessage, data.statusCode);
        }
    } else {
        debug("data result IhttpGet is undefined", data);
    }

    return undefined;
}
