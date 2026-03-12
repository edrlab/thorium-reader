// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import * as mime from "mime-types";

import { Publication } from "@r2-shared-js/models/publication";
import { Link } from "@r2-shared-js/models/publication-link";
import { bufferToStream, streamToBufferPromise } from "@r2-utils-js/_utils/stream/BufferUtils";
import { IStreamAndLength } from "@r2-utils-js/_utils/zip/zip";

import { ITransformer } from "./transformer";

const debug = debug_("r2:shared#transform/transformer-html");

export type TTransformFunction = (
    publication: Publication,
    link: Link,
    url: string | undefined,
    data: string,
    sessionInfo: string | undefined,
) => Promise<string> | string;

export class TransformerHTML implements ITransformer {

    private readonly transformString: TTransformFunction;

    constructor(transformerFunction: TTransformFunction) {
        this.transformString = transformerFunction;
    }

    public supports(_publication: Publication, link: Link): boolean {

        let mediaType = mime.lookup(link.Href);
        if (link && link.TypeLink) {
            mediaType = link.TypeLink;
        }

        if (mediaType === "text/html" || mediaType === "application/xhtml+xml") {
            // const pubDefinesLayout = publication.Metadata && publication.Metadata.Rendition
            //     && publication.Metadata.Rendition.Layout;
            // const pubIsFixed = pubDefinesLayout && publication.Metadata.Rendition.Layout === "fixed";

            // const linkDefinesLayout = link.Properties && link.Properties.Layout;
            // const linkIsFixed = linkDefinesLayout && link.Properties.Layout === "fixed";

            // if (linkIsFixed || pubIsFixed) {
            //     return false;
            // }

            // pass: reflow doc or fixed layout (e.g. not for ReadiumCSS, but for audio/video patch)
            return true;
        }

        return false;
    }

    public async transformStream(
        publication: Publication,
        link: Link,
        url: string | undefined,
        stream: IStreamAndLength,
        _isPartialByteRangeRequest: boolean,
        _partialByteBegin: number,
        _partialByteEnd: number,
        sessionInfo: string | undefined,
        ): Promise<IStreamAndLength> {

        let data: Buffer;
        try {
            data = await streamToBufferPromise(stream.stream);
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            return Promise.reject(err);
        }

        let buff: Buffer;
        try {
            buff = await this.transformBuffer(publication, link, url, data, sessionInfo);
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            return Promise.reject(err);
        }

        const sal: IStreamAndLength = {
            length: buff.length,
            reset: async () => {
                return Promise.resolve(sal);
            },
            stream: bufferToStream(buff),
        };
        return Promise.resolve(sal);
    }

    private async transformBuffer(
        publication: Publication,
        link: Link,
        url: string | undefined,
        data: Buffer,
        sessionInfo: string | undefined,
    ): Promise<Buffer> {

        try {
            const str = data.toString("utf8");
            const str_ = await Promise.resolve(this.transformString(publication, link, url, str, sessionInfo));
            return Promise.resolve(Buffer.from(str_));
        } catch (err) {
            debug("TransformerHTML fail => no change");
            debug(err);
            return Promise.resolve(data); //  no change
        }
    }
}
