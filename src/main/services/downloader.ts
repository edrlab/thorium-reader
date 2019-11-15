// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as fs from "fs";
import { injectable } from "inversify";
import * as path from "path";
import { Download } from "readium-desktop/common/models/download";
import { DownloadStatus } from "readium-desktop/common/models/downloadable";
import { diMainGet } from "readium-desktop/main/di";
import * as request from "request";
import { tmpNameSync } from "tmp";
import { URL } from "url";
import * as uuid from "uuid";

type TRequestCoreOptionsRequiredUriUrl = request.CoreOptions & request.RequiredUriUrl;
type TRequestCoreOptionsOptionalUriUrl = request.CoreOptions & request.OptionalUriUrl;

// Logger
const debug = debug_("readium-desktop:main#services/downloader");

interface DownloadRegistry {
    [identifier: string]: Download;
}

export interface DownloadProgressListener {
    onProgress: (dl: Download) => void;
}

@injectable()
export class Downloader {
    // Path where files are downloaded
    private dstRepositoryPath: string;

    // List of downloads
    private downloads: DownloadRegistry;

    public constructor(dstRepositoryPath: string) {
        this.dstRepositoryPath = dstRepositoryPath;
        this.downloads = {};
    }

    public addDownload(url: string): Download {
        // Get extension from url
        const urlObj = new URL(url);
        const ext = path.extname(urlObj.pathname);

        // Create temporary file as destination file
        const dstPath = tmpNameSync({
            dir: this.dstRepositoryPath,
            prefix: "readium-desktop-",
            postfix: `${ext}.part`});

        // Create download
        const identifier = uuid.v4();
        const download: Download = {
            identifier,
            srcUrl: url,
            dstPath,
            progress: 0,
            downloadedSize: 0,
            status: DownloadStatus.Init,
        };

        // Append to download queue
        this.downloads[identifier] = download;
        return download;
    }

    public async processDownload(
        identifier: string,
        progressListener?: DownloadProgressListener,
        options?: TRequestCoreOptionsOptionalUriUrl,
    ): Promise<Download> {
        // Retrieve download
        const download = this.downloads[identifier];
        download.status = DownloadStatus.Downloading;

        // Do not pipe request directly to this stream to void blocking issues
        const outputStream = fs.createWriteStream(download.dstPath);

        // Last time we poll the request progress
        let progressLastTime = new Date();

        const store = diMainGet("store");
        const locale = store.getState().i18n.locale;

        options = options || {} as TRequestCoreOptionsOptionalUriUrl;
        options.headers = options.headers || {};

        const headerFromOptions = {};
        for (const [key, value] of Object.entries(options.headers)) {
            Object.assign(headerFromOptions, {
                [key.toLowerCase()]: value,
            });
        }

        const headers = Object.assign(headerFromOptions, {
            "user-agent": "readium-desktop",
            "accept-language": `${locale},en-US;q=0.7,en;q=0.5`,
        });
        const requestOptions: TRequestCoreOptionsRequiredUriUrl = Object.assign(
            {timeout: 25000},
            options,
            {
                url: download.srcUrl,
                method: "GET",
                encoding: undefined,
                headers,
            },
        );

        const requestStream = request(requestOptions);

        return new Promise<Download>((resolve, reject) => {
            requestStream.on("response", (response) => {
                if (response.statusCode < 200 || response.statusCode > 299) {
                    // Unable to download the resource
                    download.status = DownloadStatus.Failed;
                    download.progress = 0;
                    download.downloadedSize = 0;
                    debug("Error while downloading resource", download, response.statusCode);
                    outputStream.end(null, null, () => {
                        reject("Error while downloading resource: " + response.statusCode);
                    });
                    return;
                }

                download.status = DownloadStatus.Downloading;

                // https://github.com/request/request/blob/212570b6971a732b8dd9f3c73354bcdda158a737/request.js#L419-L440
                const contentLength = response.headers["content-length"];
                const totalSize: number = typeof contentLength === "string" ?
                                            parseInt(contentLength, 10) : contentLength;

                let downloadedSize: number = 0;

                // Progress in percent
                let progress: number = 0;

                response.on("data", (chunk) => {
                    // Write chunk
                    outputStream.write(chunk);

                    // Download progress
                    downloadedSize += chunk.length;
                    const currentTime = new Date();
                    const elapsedMilliSeconds = currentTime.getTime() - progressLastTime.getTime();

                    if (elapsedMilliSeconds > 500) {
                        progress = Math.round((downloadedSize / totalSize) * 100);
                        download.progress = progress;
                        download.downloadedSize = downloadedSize;
                        progressLastTime = currentTime;
                        debug("Downloading ...", download, this.downloads);

                        if (progressListener != null) {
                            progressListener.onProgress(download);
                        }
                    }
                });

                response.on("end", () => {
                    // Download finished
                    download.progress = 100;
                    download.status = DownloadStatus.Downloaded;
                    download.downloadedSize = downloadedSize;
                    outputStream.end(null, null, () => {
                        return resolve(download);
                    });
                });
            });

            // Catch errors
            requestStream.on("error", (error) => {
                // Download error
                download.status = DownloadStatus.Failed;
                // keep existing (just in case error is half-way through download)
                // download.progress = 0;
                // download.downloadedSize = 0;
                outputStream.end(null, null, () => {
                    return reject(error);
                });
            });
        });
    }
}
