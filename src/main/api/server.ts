// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { createReadStream } from "fs";
import { inject, injectable } from "inversify";
import * as path from "path";
import { OPDSPublication } from "r2-opds-js/dist/es6-es2015/src/opds/opds2/opds2-publication";
import { IServerApi } from "readium-desktop/common/api/interface/server.interface";
import { extensionToTypeLink } from "readium-desktop/common/extension";
import { ToastType } from "readium-desktop/common/models/toast";
import { toastActions } from "readium-desktop/common/redux/actions";
import { PublicationView } from "readium-desktop/common/views/publication";
import { Store } from "redux";
import * as request from "request";

import { TaJsonDeserialize, TaJsonSerialize } from "@r2-lcp-js/serializable";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";

import { diSymbolTable } from "../diSymbolTable";
import { serverActions } from "../redux/actions";
import { RootState } from "../redux/states";
import { PublicationStorage } from "../storage/publication-storage";

const debug = debug_("readium-desktop:src/main/api/server");

@injectable()
export class ServerApi implements IServerApi {

    @inject(diSymbolTable.store)
    private readonly store!: Store<RootState>;

    @inject(diSymbolTable["publication-storage"])
    private readonly pubStorage!: PublicationStorage;

    public async getUrl(): Promise<string> {
        const value = this.store.getState().server.url;

        debug("server getUrl", value);

        return value;
    }

    public async setUrl(value: string): Promise<void> {
        this.store.dispatch(serverActions.setUrl.build(value));

        debug("server setUrl", value);
    }

    public async publishPublication(pub: PublicationView): Promise<void> {

        const serverUrlString = this.store.getState().server.url;
        debug("publish on server", serverUrlString, pub.identifier);

        let coverUrlToPublish = ""; // set a default url
        let thumbnailUrlToPublish = "";
        let epubUrlToPublish = "";

        const storeUrl = new URL(serverUrlString + "/store");
        const publicationUrl = new URL(serverUrlString + "/publication");
        const id = pub.identifier;

        try {

            const { coverUrl } = pub.cover;
            if (coverUrl && coverUrl.startsWith("store://")) {

                // Extract publication item relative url
                // src/main/redux/sagas/app.ts
                const relativeUrl = coverUrl.substr(6); // "store:/
                const filePath = path.join(this.pubStorage.getRootPath(), relativeUrl);

                coverUrlToPublish = await this.publishFileAndReturnUrl(filePath, storeUrl);
            }
        } catch (e) {
            debug("can't get the cover URL", e);
        }

        try {

            const { thumbnailUrl } = pub.cover;
            if (thumbnailUrl && thumbnailUrl.startsWith("store://")) {

                // Extract publication item relative url
                // src/main/redux/sagas/app.ts
                const relativeUrl = thumbnailUrl.substr(6); // "store:/
                const filePath = path.join(this.pubStorage.getRootPath(), relativeUrl);

                thumbnailUrlToPublish = await this.publishFileAndReturnUrl(filePath, storeUrl);
            }
        } catch (e) {
            debug("can't get the thumbnail URL", e);
        }

        try {
            const epubFilePath = this.pubStorage.getPublicationEpubPath(id);
            if (epubFilePath) {

                epubUrlToPublish = await this.publishFileAndReturnUrl(epubFilePath, storeUrl);
            }
        } catch (e) {
            debug("can't get the epub URL", e);
        }

        try {

            if (!epubUrlToPublish) {
                throw new Error("can't publish the epub file in the publication server");
            }

            const r2B64 = pub.r2PublicationBase64;
            const r2Buffer = Buffer.from(r2B64, "base64");
            const r2Pub = TaJsonDeserialize(r2Buffer.toString(), R2Publication);

            const publication = new OPDSPublication();

            publication.Metadata = r2Pub.Metadata;

            if (thumbnailUrlToPublish) {
                // @ts-ignore
                publication.AddImage(thumbnailUrlToPublish, coverLink.TypeLink);
            }
            if (coverUrlToPublish) {
                // @ts-ignore
                publication.AddImage(coverUrlToPublish, coverLink.TypeLink);
            }

            const typelink = extensionToTypeLink[path.extname(epubUrlToPublish)] || "";
            publication.AddLink_(epubUrlToPublish, typelink, "http://opds-spec.org/acquisition/open-access", "");

            await this.publishOPDSPublicationToServer(publication, publicationUrl);

            this.store.dispatch(
                toastActions.openRequest.build(
                    ToastType.Success,
                    pub.title || "" + "is published on the publication server",
                ),
            );

        } catch (e) {
            debug("ERROR to save the epub in the publication server");
            debug("ERROR: ", e);

            this.store.dispatch(
                toastActions.openRequest.build(
                    ToastType.Error,
                    "Error to publish the publication on the publication server" + e.toString(),
                ),
            );
        }
    }

    private async publishOPDSPublicationToServer(publication: OPDSPublication, url: URL): Promise<void> {

        return new Promise<void>((resolve, reject) => {

            request.post(url.toString(), {
                body: TaJsonSerialize(publication),
            }, (err, res) => {
                if (err) {
                    debug("Error to post publication on server", err, res?.toJSON());
                } else {
                    const dataResponse = res.toJSON();
                    const data = dataResponse.body;
                    let dataStr = "";

                    if (Buffer.isBuffer(data)) {
                        dataStr = data.toString();
                    } else if (typeof data === "string") {
                        dataStr = data;
                    } else {
                        debug("can't read data", data);
                    }

                    try {
                        const json = JSON.parse(dataStr);

                        if (json.error) {
                            debug("response error", json.error);
                        } else {
                            debug("request success, publication saved", json);

                            resolve();
                            return;
                        }
                    } catch (e) {
                        debug("error to parse the json in response to publication post");
                    }
                }

                reject("post request error with the OPDSPublication");
            });

        });
    }

    private async publishFileAndReturnUrl(filePath: string, url: URL): Promise<string> {

        const stream = createReadStream(filePath);

        const filename = path.basename(filePath);
        url.searchParams.append("filename", filename);

        return new Promise<string>((resolve, reject) => {

            stream
                .pipe(
                    request.post(
                        url.toString(),
                    ),
                )
                .on("data", (data) => {

                    try {

                        const dataString = Buffer.isBuffer(data) ? data.toString() : data;
                        const json = JSON.parse(dataString);

                        if (json.error) {
                            debug("error on cover post response", json.error);
                        } else if (json.url && typeof json.url === "string") {
                            resolve(json.url);

                            debug("coverUrlToPublish", json.url);

                            return;
                        }
                    } catch (e) {

                        debug("cover post response error, not a json response", e);
                    }

                    reject("post request error on /store route");

                })
                .on("error", (e) => {
                    reject("post request error on /store route");
                    debug(filePath, e);
                })
                .on("end", () => {
                    debug("end");

                    reject();
                })
                .on("close", () => {
                    debug("close");

                    reject();
                });

        });
    }
}
