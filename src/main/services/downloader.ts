// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { app } from "electron";
import * as fs from "fs";
import { injectable } from "inversify";
import { acceptedExtensionObject } from "readium-desktop/common/extension";
import { Download } from "readium-desktop/common/models/download";
import { DownloadStatus } from "readium-desktop/common/models/downloadable";
import { AccessTokenMap } from "readium-desktop/common/redux/states/catalog";
import { ConfigRepository } from "readium-desktop/main/db/repository/config";
import { RootState } from "readium-desktop/main/redux/states";
import { IS_DEV } from "readium-desktop/preprocessor-directives";
import { ContentType } from "readium-desktop/utils/content-type";
import { Store } from "redux";
import * as request from "request";
import { tmpNameSync } from "tmp";
import { v4 as uuidv4 } from "uuid";

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

    // CONSTRUCTOR INJECTION!
    // inject(diSymbolTable["config-repository"])
    private readonly configRepository!: ConfigRepository<AccessTokenMap>;

    // CONSTRUCTOR INJECTION!
    // inject(diSymbolTable.store)
    private readonly store!: Store<RootState>;

    // Path/folder where files are downloaded, relative to:
    // os.tmpdir()
    // app.getPath("temp")
    private downloadFolder: string | null | undefined;

    // List of downloads
    private downloads: DownloadRegistry;

    public constructor(
        downloadFolder: string | null | undefined,
        configRepository: ConfigRepository<AccessTokenMap>, // INJECTED!
        store: Store<RootState>, // INJECTED!
        ) {
        this.downloadFolder = downloadFolder;
        this.configRepository = configRepository;
        this.store = store;

        this.downloads = {};
    }

    public addDownload(url: string, ext: string): Download {

        // TODO: "any" because out of date TypeScript typings for "tmp" package :(
        const dstPath = tmpNameSync({
            tmpdir: this.downloadFolder || app.getPath("temp"), // os.tmpdir(),
            prefix: "readium-desktop-",
            postfix: ext ? `${ext}` : undefined});

        // Create download
        const identifier = uuidv4();
        const download: Download = {
            identifier,
            srcUrl: url,
            dstPath,
            extension: ext ? ext : undefined,
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

        debug("DOWNLOAD process: ", download.srcUrl);

        // Last time we poll the request progress
        let progressLastTime = new Date();

        const locale = this.store.getState().i18n.locale;

        options = options || {} as TRequestCoreOptionsOptionalUriUrl;
        options.headers = options.headers || {};

        const headerFromOptions: request.Headers = {};
        for (const [key, value] of Object.entries(options.headers)) {
            Object.assign(headerFromOptions, {
                [key.toLowerCase()]: value,
            });
        }

        let savedAccessTokens: AccessTokenMap = {};
        try {
            // Why is this undefined?? Injection async problem?
            const configDoc = await this.configRepository.get("oauth");
            savedAccessTokens = configDoc.value;
        } catch (err) {
            debug("oauth get");
            debug(err);
        }
        const domain = download.srcUrl.replace(/^https?:\/\/([^\/]+)\/?.*$/, "$1");
        const accessToken = savedAccessTokens ? savedAccessTokens[domain] : undefined;

        const headers: request.Headers = Object.assign(headerFromOptions, {
            "user-agent": "readium-desktop",
            "accept-language": `${locale},en-US;q=0.7,en;q=0.5`,
            "Authorization": accessToken ? `Bearer ${accessToken.authenticationToken}` : undefined,
        });
        const requestOptions: TRequestCoreOptionsRequiredUriUrl = Object.assign(
            {timeout: 25000},
            options,
            {
                url: download.srcUrl,
                method: "GET",
                encoding: undefined,
                headers,
                agentOptions: {
                    rejectUnauthorized: IS_DEV ? false : true,
                },
            },
        );

        const requestStream = request(requestOptions);

        return new Promise<Download>((resolve, reject) => {

            // Do not pipe request directly to this stream to void blocking issues
            let outputStream: fs.WriteStream | undefined;

            requestStream.on("response", (response) => {
                if (response.statusCode < 200 || response.statusCode > 299) {
                    // Unable to download the resource
                    download.status = DownloadStatus.Failed;
                    download.progress = 0;
                    download.downloadedSize = 0;
                    debug("Error while downloading resource", download, response.statusCode);
                    return reject("Error while downloading resource: " + response.statusCode);
                }
                if (!download.extension) {
                    const contentType = response.headers["content-type"];
                    const contentDisposition = response.headers["content-disposition"];
                    // attachment; filename=a2c99eb2-f52f-4d20-8078-6a94b531c50e.epub

                    const isLcpFile = contentType === ContentType.Lcp ||
                        contentDisposition && contentDisposition.endsWith(acceptedExtensionObject.lcpLicence);

                    const isEpubFile = contentType === ContentType.Epub ||
                        contentDisposition && contentDisposition.endsWith(acceptedExtensionObject.epub);

                    const isAudioBookPacked = contentType === ContentType.AudioBookPacked ||
                        contentDisposition && contentDisposition.endsWith(acceptedExtensionObject.audiobook);

                    const isAudioBookPackedLcp = contentType === ContentType.AudioBookPackedLcp ||
                        contentDisposition && contentDisposition.endsWith(acceptedExtensionObject.audiobookLcp);

                    const ext = isLcpFile ? acceptedExtensionObject.lcpLicence :
                        (isEpubFile ? acceptedExtensionObject.epub :
                        (isAudioBookPacked ? acceptedExtensionObject.audiobook :
                            (isAudioBookPackedLcp ? acceptedExtensionObject.audiobookLcp : // not acceptedExtensionObject.audiobookLcpAlt
                                ".unknown-ext")));
                    download.dstPath += ext;
                }
                outputStream = fs.createWriteStream(download.dstPath);
                download.status = DownloadStatus.Downloading;

                // https://github.com/request/request/blob/212570b6971a732b8dd9f3c73354bcdda158a737/request.js#L419-L440
                const contentLength = response.headers["content-length"];
                const totalSize = contentLength ?
                    (typeof contentLength === "string" ? parseInt(contentLength, 10) : contentLength) :
                    Infinity;

                let downloadedSize = 0;
                let progress = 0;

                response.on("data", (chunk) => {
                    if (outputStream) {
                        outputStream.write(chunk);
                    }

                    // Download progress
                    downloadedSize += chunk.length;
                    const currentTime = new Date();
                    const elapsedMilliSeconds = currentTime.getTime() - progressLastTime.getTime();

                    if (elapsedMilliSeconds > 500) {
                        progress = Math.round((downloadedSize / totalSize) * 100);
                        download.progress = progress;
                        download.downloadedSize = downloadedSize;
                        progressLastTime = currentTime;
                        debug("Downloading ...", download);
                        debug("Downloads:", this.downloads);

                        if (progressListener != null) {
                            progressListener.onProgress(download);
                        }
                    }
                });

                response.on("end", () => {
                    download.progress = 100;
                    download.status = DownloadStatus.Downloaded;
                    download.downloadedSize = downloadedSize;

                    // cleanup queue
                    this.downloads[identifier] = undefined;
                    delete this.downloads[identifier];
                    if (outputStream) {
                        outputStream.end(null, null, () => {
                            outputStream = undefined;
                            return resolve(download);
                        });
                    } else { // this should really never happen, but safeguard.
                        return resolve(download);
                    }
                });
            });

            requestStream.on("error", (error) => {
                debug("requestStream error: ", error);

                download.status = DownloadStatus.Failed;
                // keep existing (just in case error is half-way through download)
                // download.progress = 0;
                // download.downloadedSize = 0;

                // cleanup queue
                this.downloads[identifier] = undefined;
                delete this.downloads[identifier];

                if (outputStream) {
                    outputStream.end(null, null, () => {
                        outputStream = undefined;
                        return reject(error);
                    });
                } else {
                    return reject(error);
                }
            });
        });
    }
}
