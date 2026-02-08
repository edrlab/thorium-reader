// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as express from "express";

import { Publication } from "@r2-shared-js/models/publication";
import { Link } from "@r2-shared-js/models/publication-link";
import { Transformers } from "@r2-shared-js/transform/transformer";
import { TTransformFunction, TransformerHTML } from "@r2-shared-js/transform/transformer-html";
import { Server } from "@r2-streamer-js/http/server";

import { IEventPayload_R2_EVENT_READIUMCSS } from "../common/events";
import { readiumCssTransformHtml } from "../common/readium-css-inject";
import { READIUM_CSS_URL_PATH } from "../common/readium-css-settings";
import { URL_PARAM_IS_IFRAME } from "../renderer/common/url-params";

const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");

function isFixedLayout(publication: Publication, link: Link | undefined): boolean {
    if (link && link.Properties) {
        if (link.Properties.Layout === "fixed") {
            return true;
        }
        if (typeof link.Properties.Layout !== "undefined") {
            return false;
        }
    }
    if (publication &&
        publication.Metadata &&
        publication.Metadata.Rendition) {
        return publication.Metadata.Rendition.Layout === "fixed";
    }
    return false;
}

export type TReadiumCssGetterFunction = (
    publication: Publication,
    link: Link,
    sessionInfo: string | undefined,
) => IEventPayload_R2_EVENT_READIUMCSS;

export function setupReadiumCSS(
    server: Server,
    folderPath: string,
    readiumCssGetter: TReadiumCssGetterFunction) {

    // https://expressjs.com/en/4x/api.html#express.static
    const staticOptions = {
        dotfiles: "ignore",
        etag: true,
        fallthrough: false,
        immutable: true,
        index: false,
        maxAge: "1d",
        redirect: false,
        // extensions: ["css", "otf"],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setHeaders: (res: express.Response, _path: string, _stat: any) => {
            //   res.set('x-timestamp', Date.now())
            server.setResponseCORS(res);
        },
    };

    server.expressUse("/" + READIUM_CSS_URL_PATH, express.static(folderPath, staticOptions));

    const transformerReadiumCss: TTransformFunction = (
        publication: Publication,
        link: Link,
        url: string | undefined,
        str: string,
        sessionInfo: string | undefined,
    ): string => {

        let isIframe = false;
        if (url) {
            const url_ = new URL(url);
            if (url_.searchParams.has(URL_PARAM_IS_IFRAME)) {
                isIframe = true;
            }
        }

        if (isIframe) {
            return str;
        }

        let readiumcssJson = readiumCssGetter(publication, link, sessionInfo);
        if (isFixedLayout(publication, link)) {
            const readiumcssJson_ = { setCSS: undefined, isFixedLayout: true } as IEventPayload_R2_EVENT_READIUMCSS;
            if (readiumcssJson.setCSS) {
                if (readiumcssJson.setCSS.mathJax) {
                    // TODO: apply MathJax to FXL?
                    // (reminder: setCSS must remain 'undefined'
                    // in order to completely remove ReadiumCSS from FXL docs)
                }
                if (readiumcssJson.setCSS.reduceMotion) {
                    // TODO: same as MathJax (see above)
                }
                // if (readiumcssJson.setCSS.audioPlaybackRate) {
                //     // TODO: same as MathJax (see above)
                // }
            }
            readiumcssJson = readiumcssJson_;
        }

        if (readiumcssJson) {
            if (!readiumcssJson.urlRoot) {
                const u = server.serverUrl();
                if (u) {
                    readiumcssJson.urlRoot = u;
                }
            }
            if (IS_DEV) {
                console.log("_____ readiumCssJson.urlRoot (setupReadiumCSS() transformer): ", readiumcssJson.urlRoot);
            }

            // import * as mime from "mime-types";
            let mediaType = "application/xhtml+xml"; // mime.lookup(link.Href);
            if (link && link.TypeLink) {
                mediaType = link.TypeLink;
            }

            return readiumCssTransformHtml(str, readiumcssJson, mediaType);
        } else {
            return str;
        }
    };
    Transformers.instance().add(new TransformerHTML(transformerReadiumCss));
}
