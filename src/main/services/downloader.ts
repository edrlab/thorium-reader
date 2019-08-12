// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { injectable} from "inversify";

import * as debug_ from "debug";
import * as fs from "fs";
import * as path from "path";
import * as request from "request";
import { tmpNameSync } from "tmp";
import { URL } from "url";
import * as uuid from "uuid";

import { Download } from "readium-desktop/common/models/download";
import { DownloadStatus } from "readium-desktop/common/models/downloadable";

// Logger
const debug = debug_("readium-desktop:main#services/downloader");

interface DownloadRegistry {
    [identifier: string]: Download;
}

export interface DownloadProgressListener {
    onProgress: any;
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
    ): Promise<Download> {
        // Retrieve download
        const download = this.downloads[identifier];
        download.status = DownloadStatus.Downloading;

        // Do not pipe request directly to this stream to void blocking issues
        const outputStream = fs.createWriteStream(download.dstPath);

        // Last time we poll the request progress
        let progressLastTime = new Date();

        // 5 seconds of timeout
        const requestStream = request.get(
            download.srcUrl,
            {timeout: 5000},
        );

        return new Promise<Download>((resolve, reject) => {
            requestStream.on("response", (response) => {
                if (response.statusCode < 200 || response.statusCode > 299) {
                    // Unable to download the resource
                    download.status = DownloadStatus.Failed;
                    debug("Error while downloading resource", download, response.statusCode);
                    outputStream.end(null, null, () => {
                        reject("Error while downloading resource");
                    });
                }

                download.status = DownloadStatus.Downloading;

                // https://github.com/request/request/blob/master/request.js#L419
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
                    const elapsedSeconds = (
                        currentTime.getTime() -
                        progressLastTime.getTime()
                    ) / 1000;

                    if (elapsedSeconds > 1) {
                        // Refresh progress at best every 1 seconds
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
                outputStream.end(null, null, () => {
                    return reject(error);
                });
            });
        });
    }
}
