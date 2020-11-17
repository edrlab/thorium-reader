// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { app, protocol, Request, session, StreamProtocolResponse } from "electron";
import * as path from "path";
import {
    PublicationParsePromise,
} from "r2-shared-js/dist/es6-es2015/src/parser/publication-parser";
import { computeReadiumCssJsonMessage } from "readium-desktop/common/computeReadiumCssJsonMessage";
import { ReaderConfig } from "readium-desktop/common/models/reader";
import { diMainGet } from "readium-desktop/main/di";
import { _NODE_MODULE_RELATIVE_URL, _PACKAGING } from "readium-desktop/preprocessor-directives";

import { IEventPayload_R2_EVENT_READIUMCSS } from "@r2-navigator-js/electron/common/events";
import { readiumCssTransformHtml } from "@r2-navigator-js/electron/common/readium-css-inject";
import { clearSessions, getWebViewSession } from "@r2-navigator-js/electron/main/sessions";
import { URL_PARAM_IS_IFRAME } from "@r2-navigator-js/electron/renderer/common/url-params";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { Link } from "@r2-shared-js/models/publication-link";
import { Transformers } from "@r2-shared-js/transform/transformer";
import { TransformerHTML, TTransformFunction } from "@r2-shared-js/transform/transformer-html";
import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";
import { bufferToStream } from "@r2-utils-js/_utils/stream/BufferUtils";

const debug = debug_("readium-desktop:main#streamer");

const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");

export const THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL = "thoriumhttps";
const MATHJAX_URL_PATH = "math-jax";
// const READIUM_CSS_URL_PATH = "readium-css";

let rcssPath = "ReadiumCSS";
if (_PACKAGING === "1") {
    rcssPath = path.normalize(path.join(__dirname, rcssPath));
} else {
    rcssPath = "r2-navigator-js/dist/ReadiumCSS";
    rcssPath = path.normalize(path.join(__dirname, _NODE_MODULE_RELATIVE_URL, rcssPath));
}

rcssPath = rcssPath.replace(/\\/g, "/");
debug("readium css path:", rcssPath);

let mathJaxPath = "MathJax";
if (_PACKAGING === "1") {
    mathJaxPath = path.normalize(path.join(__dirname, mathJaxPath));
} else {
    mathJaxPath = "mathjax";
    mathJaxPath = path.normalize(path.join(__dirname, _NODE_MODULE_RELATIVE_URL, mathJaxPath));
}
mathJaxPath = mathJaxPath.replace(/\\/g, "/");
debug("MathJax path:", mathJaxPath);

function computeReadiumCssJsonMessageInStreamer(
    _r2Publication: R2Publication,
    _link: Link | undefined,
    sessionInfo: string | undefined,
): IEventPayload_R2_EVENT_READIUMCSS {

    const winId = Buffer.from(sessionInfo || "", "base64").toString("utf-8");
    debug("winId:", winId);

    let settings: ReaderConfig;
    if (winId) {

        const store = diMainGet("store");
        const state = store.getState();

        try {
            settings = state.win.session.reader[winId].reduxState.config;

            debug("PAGED: ", settings.paged, "colCount:", settings.colCount);

        } catch (err) {
            settings = state.reader.defaultConfig;

            debug("settings from default config");
            debug("ERROR", err);
        }
    } else {

        const store = diMainGet("store");
        settings = store.getState().reader.defaultConfig;
    }

    return computeReadiumCssJsonMessage(settings);
}

// rcssPath

function isFixedLayout(publication: R2Publication, link: Link | undefined): boolean {
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

const transformerReadiumCss: TTransformFunction = (
    publication: R2Publication,
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

    let readiumcssJson = computeReadiumCssJsonMessageInStreamer(publication, link, sessionInfo);
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
             // `/${READIUM_CSS_URL_PATH}/`
            readiumcssJson.urlRoot = THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL + "://host";
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

const transformerMathJax = (_publication: R2Publication, _link: Link, _url: string | undefined, str: string): string => {

    const cssElectronMouseDrag =
        `
<style type="text/css">
*,
*::after,
*::before {
    -webkit-user-drag: none !important;
    -webkit-app-region: no-drag !important;
}
</style>
`;

    str = str.replace(/<\/head>/, `${cssElectronMouseDrag}</head>`);

    const store = diMainGet("store");
    // TODO
    // Same comment that above
    const settings = store.getState().reader.defaultConfig;

    if (settings.enableMathJax) {
        const url = `${THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL}://host/${MATHJAX_URL_PATH}/es5/tex-mml-chtml.js`;
        const script = `
        <script type="text/javascript">
window.MathJax = {
    startup: {
        ready: () => {
            console.log('MathJax is loaded, but not yet initialized');
            window.MathJax.startup.defaultReady();
            console.log('MathJax is initialized, and the initial typeset is queued');
            window.MathJax.startup.promise.then(() => {
                console.log('MathJax initial typesetting complete');
            });
        }
    }
};
        </script>
        <script type="text/javascript" async="async" src="${url}"> </script>`;
        return str.replace(/<\/head>/, `${script}</head>`);
    } else {
        return str;
    }
};
Transformers.instance().add(new TransformerHTML(transformerMathJax));

const streamProtocolHandler = (
    req: Request,
    callback: (stream?: (NodeJS.ReadableStream) | (StreamProtocolResponse)) => void) => {

    // debug("streamProtocolHandler:");
    // debug(req.url);
    // debug(req.referrer);
    // debug(req.method);
    // debug(req.headers);

    debug(req.url);
    const u = new URL(req.url);
    let ref = u.origin;
    debug(ref);
    if (req.referrer && req.referrer.trim()) {
        ref = req.referrer;
        debug(ref);
    }

    const headers: Record<string, (string) | (string[])> = {};
    Object.keys(req.headers).forEach((header: string) => {
        const val = req.headers[header];

        debug(header + " => " + val);

        if (val) {
            headers[header] = val;
        }
    });
    if (!headers.referer) {
        headers.referer = ref;
    }
    headers["Content-Type"] = "application/xhtml+xml";
    const buff = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml">HELLO</html>`);
    headers["Content-Length"] = buff.length.toString();
    const obj = {
        // NodeJS.ReadableStream
        data: bufferToStream(buff),
        headers,
        statusCode: 200,
    };
    callback(obj);

    // TODO: fetch publication resource (base64 path?)
};

export function initSessions() {
    app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

    protocol.registerSchemesAsPrivileged([{
        privileges: {
            allowServiceWorkers: false,
            bypassCSP: false,
            corsEnabled: true,
            secure: true,
            standard: true,
            supportFetchAPI: true,
        },
        scheme: THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL,
    }]);

    app.on("ready", async () => {
        debug("app ready");

        try {
            await clearSessions();
        } catch (err) {
            debug(err);
        }

        if (session.defaultSession) {
            session.defaultSession.protocol.registerStreamProtocol(
                THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL,
                streamProtocolHandler,
                (error: Error) => {
                    if (error) {
                        debug("registerStreamProtocol ERROR (default session)");
                        debug(error);
                    } else {
                        debug("registerStreamProtocol OKAY (default session)");
                    }
                });
        }
        const webViewSession = getWebViewSession();
        if (webViewSession) {
            webViewSession.protocol.registerStreamProtocol(
                THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL,
                streamProtocolHandler,
                (error: Error) => {
                    if (error) {
                        debug("registerStreamProtocol ERROR (webview session)");
                        debug(error);
                    } else {
                        debug("registerStreamProtocol OKAY (webview session)");
                    }
                });

            // webViewSession.setPermissionRequestHandler((wc, permission, callback) => {
            //     debug("setPermissionRequestHandler");
            //     debug(wc.getURL());
            //     debug(permission);
            //     callback(true);
            // });
        }
    });
}

interface IPathPublicationMap { [key: string]: R2Publication; }
const _publications: string[] = [];
const _pathPublicationMap: IPathPublicationMap = {};

export function streamerAddPublications(pubs: string[]): string[] {
    pubs.forEach((pub) => {
        if (_publications.indexOf(pub) < 0) {
            _publications.push(pub);
        }
    });

    return pubs.map((pub) => {
        const pubid = encodeURIComponent_RFC3986(Buffer.from(pub).toString("base64"));
        return `/pub/${pubid}/manifest.json`;
    });
}

export function streamerRemovePublications(pubs: string[]): string[] {
    pubs.forEach((pub) => {
        streamerUncachePublication(pub);
        const i = _publications.indexOf(pub);
        if (i >= 0) {
            _publications.splice(i, 1);
        }
    });

    return pubs.map((pub) => {
        const pubid = encodeURIComponent_RFC3986(Buffer.from(pub).toString("base64"));
        return `/pub/${pubid}/manifest.json`;
    });
}

export async function streamerLoadOrGetCachedPublication(filePath: string): Promise<R2Publication> {

    let publication = streamerCachedPublication(filePath);
    if (!publication) {

        // const fileName = path.basename(pathBase64Str);
        // const ext = path.extname(fileName).toLowerCase();

        try {
            publication = await PublicationParsePromise(filePath);
        } catch (err) {
            debug(err);
            return Promise.reject(err);
        }

        streamerCachePublication(filePath, publication);
    }
    // return Promise.resolve(publication);
    return publication;
}

export function streamerIsPublicationCached(filePath: string): boolean {
    return typeof streamerCachedPublication(filePath) !== "undefined";
}

export function streamerCachedPublication(filePath: string): R2Publication | undefined {
    return _pathPublicationMap[filePath];
}

export function streamerCachePublication(filePath: string, pub: R2Publication) {
    // TODO: implement LRU caching algorithm? Anything smarter than this will do!
    if (!streamerIsPublicationCached(filePath)) {
        _pathPublicationMap[filePath] = pub;
    }
}

export function streamerUncachePublication(filePath: string) {
    if (streamerIsPublicationCached(filePath)) {
        const pub = streamerCachedPublication(filePath);
        if (pub) {
            pub.freeDestroy();
        }
        _pathPublicationMap[filePath] = undefined;
        delete _pathPublicationMap[filePath];
    }
}

// export function streamerGetPublications(): string[] {
//     return _publications;
// }

// export function streamerUncachePublications() {
//     Object.keys(_pathPublicationMap).forEach((filePath) => {
//         streamerUncachePublication(filePath);
//     });
// }
