// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Publication } from "@r2-shared-js/models/publication";
import { Link } from "@r2-shared-js/models/publication-link";
import { IStreamAndLength } from "@r2-utils-js/_utils/zip/zip";

import { TransformerLCP } from "./transformer-lcp";
import { TransformerObfAdobe } from "./transformer-obf-adobe";
import { TransformerObfIDPF } from "./transformer-obf-idpf";

// import { TransformerHTML } from "./transformer-html";

export interface ITransformer {
    supports(publication: Publication, link: Link): boolean;

    transformStream(
        publication: Publication,
        link: Link,
        url: string | undefined,
        stream: IStreamAndLength,
        isPartialByteRangeRequest: boolean,
        partialByteBegin: number,
        partialByteEnd: number,
        sessionInfo: string | undefined,
    ): Promise<IStreamAndLength>;

    // getDecryptedSizeStream(
    //     publication: Publication, link: Link,
    //     stream: IStreamAndLength): Promise<number>;

    // transformBuffer(publication: Publication, link: Link, data: Buffer): Promise<Buffer>;
    // getDecryptedSizeBuffer(publication: Publication, link: Link, data: Buffer): Promise<number>;
}

export class Transformers {

    public static instance(): Transformers {
        return Transformers._instance;
    }

    // public static async tryBuffer(publication: Publication, link: Link, data: Buffer): Promise<Buffer> {
    //     return Transformers.instance()._tryBuffer(publication, link, data);
    // }

    public static async tryStream(
        publication: Publication,
        link: Link,
        url: string | undefined,
        stream: IStreamAndLength,
        isPartialByteRangeRequest: boolean,
        partialByteBegin: number, partialByteEnd: number,
        sessionInfo: string | undefined,
        ): Promise<IStreamAndLength> {

        return Transformers.instance()._tryStream(
            publication, link, url,
            stream,
            isPartialByteRangeRequest,
            partialByteBegin,
            partialByteEnd,
            sessionInfo,
        );
    }

    private static _instance: Transformers = new Transformers();

    private transformers: ITransformer[];

    constructor() {
        this.transformers = [];
    }

    public add(transformer: ITransformer) {
        if (this.transformers.indexOf(transformer) < 0) {
            this.transformers.push(transformer);
        }
    }

    // private async _tryBuffer(publication: Publication, link: Link, data: Buffer): Promise<Buffer> {
    //     let transformedData: Promise<Buffer> | undefined;
    //     const transformer = this.transformers.find((t) => {
    //         if (!t.supports(publication, link)) {
    //             return false;
    //         }
    //         transformedData = t.transformBuffer(publication, link, data);
    //         if (transformedData) {
    //             return true;
    //         }
    //         return false;
    //     });
    //     if (transformer && transformedData) {
    //         return transformedData;
    //     }
    //     // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
    //     return Promise.reject("transformers fail (buffer)");
    // }

    private async _tryStream(
        publication: Publication, link: Link,
        url: string | undefined,
        stream: IStreamAndLength,
        isPartialByteRangeRequest: boolean,
        partialByteBegin: number, partialByteEnd: number,
        sessionInfo: string | undefined,
        ): Promise<IStreamAndLength> {

        let transformedData: Promise<IStreamAndLength> | undefined;
        let atLeastOne = false;

        // Return the first one that succeeds
        // ----
        // const transformer = this.transformers.find((t) => {
        //     if (!t.supports(publication, link)) {
        //         return false;
        //     } else {
        //         atLeastOne = true;
        //     }
        //     transformedData = t.transformStream(
        //         publication, link, url,
        //         stream,
        //         isPartialByteRangeRequest, partialByteBegin, partialByteEnd);
        //     if (transformedData) {
        //         return true;
        //     }
        //     return false;
        // });
        // if (transformer && transformedData) {
        //     return transformedData;
        // }
        // ----

        // Chain transformers
        // ----
        let s = stream;
        for (const t of this.transformers) {
            if (t.supports(publication, link)) {
                atLeastOne = true;
                if (transformedData) { // need to consume the promise
                    try {
                        s = await transformedData;
                    } catch (_err) {
                        transformedData = undefined;
                        break;
                    }
                }
                transformedData = t.transformStream(
                    publication,
                    link,
                    url,
                    s,
                    isPartialByteRangeRequest,
                    partialByteBegin,
                    partialByteEnd,
                    sessionInfo,
                );
            }
        }
        if (transformedData) {
            return transformedData;
        }
        // ----

        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return atLeastOne ? Promise.reject("transformers fail") : Promise.resolve(stream);
    }
}

Transformers.instance().add(new TransformerObfAdobe());
Transformers.instance().add(new TransformerObfIDPF());
Transformers.instance().add(new TransformerLCP());

// Transformers.instance().add(new TransformerHTML()); // order matters! (decrypt first)
