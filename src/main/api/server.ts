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
import { Translator } from "readium-desktop/common/services/translator";
import { PublicationView } from "readium-desktop/common/views/publication";
import { findMimeTypeWithExtension } from "readium-desktop/utils/mimeTypes";
import { Store } from "redux";
import * as request from "request";
import { resolve as urlResolve } from "url";

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

    @inject(diSymbolTable.translator)
    private readonly translator!: Translator;

    public async getUrl(): Promise<[string, string]> {
        const url = this.store.getState().server.url;
        const token = this.store.getState().server.token;

        debug("server getUrl", url, token);

        return [url, token];
    }

    public async setUrl(url: string, token: string): Promise<void> {
        this.store.dispatch(serverActions.setUrl.build(url, token));

        debug("server setUrl", url, token);
    }

    public async publishPublication(pub: PublicationView): Promise<void> {

        const __ = this.translator.translate;

        try {
            const serverUrlString = this.store.getState().server.url;

            await this.publishPublicationOnServer(pub, serverUrlString);

            this.store.dispatch(
                toastActions.openRequest.build(
                    ToastType.Success,
                    __("toast.publish.uploadSucces", { name: pub.title || ""}),
                ),
            );

        } catch (e) {
            debug("ERROR to save the epub on the publication server");
            debug("ERROR: ", e);

            this.store.dispatch(
                toastActions.openRequest.build(
                    ToastType.Error,
                    __("toast.publish.uploadError", { error: e.toString()}),
                ),
            );
        }

    }

    private async publishPublicationOnServer(pub: PublicationView, serverUrl: string)
    : Promise<void> {

        debug("publish on server", serverUrl, pub.identifier);

        let coverUrlToPublish = ""; // set a default url
        let thumbnailUrlToPublish = "";
        let epubUrlToPublish = "";
        let error = "";

        const storeUrl = urlResolve(serverUrl, "store");
        debug("storeurl", storeUrl);

        const publicationUrl = urlResolve(serverUrl, "publication");
        debug("publicationurl", publicationUrl.toString());

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

            error = e.toString();
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

            error = e.toString();
        }

        try {
            const epubFilePath = this.pubStorage.getPublicationEpubPath(id);
            if (epubFilePath) {

                epubUrlToPublish = await this.publishFileAndReturnUrl(epubFilePath, storeUrl);
            }
        } catch (e) {
            debug("can't get the epub URL", e);

            error = e.toString();
        }

        if (!epubUrlToPublish) {
            throw new Error(error);
        }

        const r2B64 = pub.r2PublicationBase64;
        const r2Buffer = Buffer.from(r2B64, "base64");
        const r2BufferStr = r2Buffer.toString();
        const r2BufferJson = JSON.parse(r2BufferStr);
        const r2Pub = TaJsonDeserialize(r2BufferJson, R2Publication);

        debug("r2pub", r2Pub);

        const publication = new OPDSPublication();

        publication.Metadata = r2Pub.Metadata;

        if (thumbnailUrlToPublish) {
            // no height and width
            // @ts-ignore
            publication.AddImage(
                thumbnailUrlToPublish,
                findMimeTypeWithExtension(path.extname(thumbnailUrlToPublish)) || "",
            );
        }
        if (coverUrlToPublish) {
            // no height and width
            // @ts-ignore
            publication.AddImage(
                coverUrlToPublish,
                findMimeTypeWithExtension(path.extname(coverUrlToPublish)) || "",
            );
        }

        const typelink = extensionToTypeLink[path.extname(epubUrlToPublish)] || "";
        publication.AddLink_(epubUrlToPublish, typelink, "http://opds-spec.org/acquisition/open-access", "");

        await this.publishOPDSPublicationToServer(publication, publicationUrl);

    }

    private async publishOPDSPublicationToServer(publication: OPDSPublication, urlStr: string): Promise<void> {

        debug("publication", publication);

        return new Promise<void>((resolve, reject) => {

            try {

                const token = this.store.getState().server.token || "";

                const jsonBody = TaJsonSerialize(publication);
                // const jsonStr = JSON.stringify(jsonBody);

                debug("body json", jsonBody);

                request.post({
                    url: urlStr,
                    json: jsonBody,
                    auth: { bearer: token },
                }, (err, res) => {
                    if (err) {
                        debug("Error to post publication on server", err, res?.toJSON());
                    } else {
                        const dataResponse = res.toJSON();
                        const data = dataResponse.body;
                        let json: any = {};

                        try {
                            if (Buffer.isBuffer(data)) {
                                json = JSON.parse(data.toString());
                            } else if (typeof data === "string") {
                                json = JSON.parse(data);
                            } else if (typeof data === "object") {
                                json = data;
                            } else {
                                debug("can't read data", data);
                            }

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
            } catch (e) {

                reject(e);
            }
        });
    }

    private async publishFileAndReturnUrl(filePath: string, urlStr: string): Promise<string> {

        const stream = createReadStream(filePath);

        const filename = path.basename(filePath);
        const url = new URL(urlStr);
        url.searchParams.append("filename", filename);

        return new Promise<string>((resolve, reject) => {

            try {

                const token = this.store.getState().server.token || "";

                stream
                    .pipe(
                        request.post(
                            {
                                url: url.toString(),
                                auth: { bearer: token },
                            },
                        ),
                    )
                    .on("response", (res) => {
                        debug("publishFile content-type", res.headers["content-type"]);
                    })
                    .on("data", (data) => {

                        debug("publishFile data received", data);

                        try {

                            const dataString = Buffer.isBuffer(data) ? data.toString() : data;

                            debug("publishFile data string received", dataString);
                            const json = JSON.parse(dataString);

                            if (json.error) {
                                debug("error on cover post response", json.error);
                            } else if (json.url && typeof json.url === "string") {
                                resolve(json.url);

                                debug("store url", json.url);

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

            } catch (e) {

                reject(e);
            }

        });
    }
}
