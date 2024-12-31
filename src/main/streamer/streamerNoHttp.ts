// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as crypto from "crypto";
import * as debug_ from "debug";
import { app, protocol, ProtocolRequest, ProtocolResponse, session } from "electron";
import * as fs from "fs";
import * as mime from "mime-types";
import * as path from "path";
import { _PACKAGING, IS_DEV } from "readium-desktop/preprocessor-directives";

import { TaJsonSerialize } from "@r2-lcp-js/serializable";
import { parseDOM, serializeDOM } from "@r2-navigator-js/electron/common/dom";
import { IEventPayload_R2_EVENT_READIUMCSS } from "@r2-navigator-js/electron/common/events";
import { readiumCssTransformHtml } from "@r2-navigator-js/electron/common/readium-css-inject";
import {
    convertCustomSchemeToHttpUrl, convertHttpUrlToCustomScheme, READIUM2_ELECTRON_HTTP_PROTOCOL,
} from "@r2-navigator-js/electron/common/sessions";
import { clearSessions, getWebViewSession } from "@r2-navigator-js/electron/main/sessions";
import {
    URL_PARAM_CLIPBOARD_INTERCEPT, URL_PARAM_CSS, URL_PARAM_DEBUG_VISUALS,
    URL_PARAM_EPUBREADINGSYSTEM, URL_PARAM_IS_IFRAME, URL_PARAM_SECOND_WEBVIEW,
    URL_PARAM_WEBVIEW_SLOT,
} from "@r2-navigator-js/electron/renderer/common/url-params";
import { zipHasEntry } from "@r2-shared-js/_utils/zipHasEntry";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { Link } from "@r2-shared-js/models/publication-link";
import {
    getAllMediaOverlays, getMediaOverlay, mediaOverlayURLParam, mediaOverlayURLPath,
} from "@r2-shared-js/parser/epub";
import { PublicationParsePromise } from "@r2-shared-js/parser/publication-parser";
import { Transformers } from "@r2-shared-js/transform/transformer";
import { TransformerHTML, TTransformFunction } from "@r2-shared-js/transform/transformer-html";
import { parseRangeHeader } from "@r2-utils-js/_utils/http/RangeUtils";
import { encodeURIComponent_RFC3986, isHTTP } from "@r2-utils-js/_utils/http/UrlUtils";
import { bufferToStream } from "@r2-utils-js/_utils/stream/BufferUtils";
import { IStreamAndLength, IZip } from "@r2-utils-js/_utils/zip/zip";

import {
    computeReadiumCssJsonMessageInStreamer, MATHJAX_FILE_PATH, MATHJAX_URL_PATH,
    READIUMCSS_FILE_PATH, setupMathJaxTransformer,
} from "./streamerCommon";
import { OPDS_MEDIA_SCHEME } from "readium-desktop/main/redux/sagas/getEventChannel";
import { THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL } from "readium-desktop/common/streamerProtocol";
import { findMimeTypeWithExtension } from "readium-desktop/utils/mimeTypes";

// import { _USE_HTTP_STREAMER } from "readium-desktop/preprocessor-directives";

const debug = debug_("readium-desktop:main#streamerNoHttp");
debug("_");

// !!!!!!
/// BE CAREFUL DEBUG HAS BEED DISABLED IN package.json
// !!!!!!

const URL_PARAM_SESSION_INFO = "r2_SESSION_INFO";

// this ceiling value seems very arbitrary ... what would be a reasonable default value?
// ... based on what metric, any particular HTTP server or client implementation?
export const MAX_PREFETCH_LINKS = 10;


const READIUM_CSS_URL_PATH = "readium-css";

if (true) { // !_USE_HTTP_STREAMER) {
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
                readiumcssJson.urlRoot = THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL + "://0.0.0.0";
            }
            if (IS_DEV) {
                debug("_____ readiumCssJson.urlRoot (setupReadiumCSS() transformer): ", readiumcssJson.urlRoot);
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

    setupMathJaxTransformer(
        () => `${THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL}://0.0.0.0/${MATHJAX_URL_PATH}/es5/tex-mml-chtml.js`,
    );
}

function getPreFetchResources(publication: R2Publication): Link[] {
    const links: Link[] = [];

    if (publication.Resources) {
        // https://w3c.github.io/publ-epub-revision/epub32/spec/epub-spec.html#cmt-grp-font
        const mediaTypes = ["text/css",
            "text/javascript", "application/javascript",
            "application/vnd.ms-opentype", "font/otf", "application/font-sfnt",
            "font/ttf", "application/font-sfnt",
            "font/woff", "application/font-woff", "font/woff2"];
        for (const mediaType of mediaTypes) {
            for (const link of publication.Resources) {
                if (link.TypeLink === mediaType) {
                    links.push(link);
                }
            }
        }
    }

    return links;
}

const streamProtocolHandlerTunnel = async (
    req: ProtocolRequest,
    callback: (stream: (NodeJS.ReadableStream) | (ProtocolResponse)) => void) => {

    debug("............... streamProtocolHandlerTunnel req.url", req.url);
    req.url = convertCustomSchemeToHttpUrl(req.url);
    streamProtocolHandler(req, callback);
};

// super hacky!! :(
// see usages of this boolean...
let _customUrlProtocolSchemeHandlerWasCalled = false;

const streamProtocolHandler = async (
    req: ProtocolRequest,
    callback: (stream: (NodeJS.ReadableStream) | (ProtocolResponse)) => void) => {

    _customUrlProtocolSchemeHandlerWasCalled = true;

    // debug("streamProtocolHandler:");
    // debug(req.url);
    // debug(req.referrer);
    // debug(req.method);
    // debug(req.headers);

    debug("streamProtocolHandler req.url", req.url);
    const u = new URL(req.url);

    // https://github.com/readium/r2-streamer-js/commit/e214b7e1f8133a8400baec3c6f2d7c8204da01ad
    // At this point, route relative path is already normalised with respect to /../ and /./ dot segments,
    // but not double slashes (which seems to be an easy mistake to make at authoring time in EPUBs),
    // so we collapse multiple slashes into a single one.
    let uPathname = u.pathname;
    if (uPathname) {
        uPathname = uPathname.replace(/\/\/+/g, "/");
        try {
            uPathname = decodeURIComponent(uPathname);
        } catch (e) {
            debug("u.pathname decodeURIComponent!?");
            debug(e);
        }
    }

    const pdfjsAssetsPrefix = "/pdfjs/";
    const isPdfjsAssets = uPathname.startsWith(pdfjsAssetsPrefix);

    const publicationAssetsPrefix = "/pub/";
    const isPublicationAssets = uPathname.startsWith(publicationAssetsPrefix);

    const mathJaxPrefix = `/${MATHJAX_URL_PATH}/`;
    const isMathJax = uPathname.startsWith(mathJaxPrefix);

    const readiumCssPrefix = `/${READIUM_CSS_URL_PATH}/`;
    const isReadiumCSS = uPathname.startsWith(readiumCssPrefix);

    const mediaOverlaysPrefix = `/${mediaOverlayURLPath}`;
    const isMediaOverlays = uPathname.endsWith(mediaOverlaysPrefix);

    debug("streamProtocolHandler uPathname", uPathname);
    debug("streamProtocolHandler isPdfjsAssets", isPdfjsAssets);
    debug("streamProtocolHandler isPublicationAssets", isPublicationAssets);
    debug("streamProtocolHandler isMathJax", isMathJax);
    debug("streamProtocolHandler isReadiumCSS", isReadiumCSS);
    debug("streamProtocolHandler isMediaOverlays", isMediaOverlays);

    const isHead = req.method.toLowerCase() === "head";
    if (isHead) {
        debug("streamProtocolHandler HEAD !!!!!!!!!!!!!!!!!!!");
    }

    let ref = u.origin;
    debug("streamProtocolHandler u.origin", ref);
    if (req.referrer && req.referrer.trim()) {
        ref = req.referrer;
        debug("streamProtocolHandler req.referrer", ref);
    }

    if (IS_DEV) {
        Object.keys(req.headers).forEach((header: string) => {
            const val = req.headers[header];

            debug("streamProtocolHandler req.header: " + header + " => " + val);

            // if (val) {
            //     headers[header] = val;
            // }
        });
    }

    const headers: Record<string, (string) | (string[])> = {};
    if (ref && ref !== "null" && !/^https?:\/\/localhost.+/.test(ref) && !/^https?:\/\/127\.0\.0\.1.+/.test(ref)) {
        headers.referer = ref;
    } else {
        headers.referer = `${THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL}://0.0.0.0/`;
    }

    // CORS everything!
    headers["Access-Control-Allow-Origin"] = "*";
    headers["Access-Control-Allow-Methods"] = "GET, HEAD, OPTIONS"; // POST, DELETE, PUT, PATCH
    // tslint:disable-next-line:max-line-length
    headers["Access-Control-Allow-Headers"] = "Content-Type, Content-Length, Accept-Ranges, Content-Range, Range, Link, Transfer-Encoding, X-Requested-With, Authorization, Accept, Origin, User-Agent, DNT, Cache-Control, Keep-Alive, If-Modified-Since";
    // tslint:disable-next-line:max-line-length
    headers["Access-Control-Expose-Headers"] = "Content-Type, Content-Length, Accept-Ranges, Content-Range, Range, Link, Transfer-Encoding, X-Requested-With, Authorization, Accept, Origin, User-Agent, DNT, Cache-Control, Keep-Alive, If-Modified-Since";

    if (isPdfjsAssets) {

        const pdfjsUrlPathname = uPathname.substr(pdfjsAssetsPrefix.length);
        debug("PDFJS request this file:", pdfjsUrlPathname);

        const pdfjsFolder = "assets/lib/pdfjs";
        let folderPath: string = path.join(__dirname, pdfjsFolder);
        if (_PACKAGING === "0") {
            folderPath = path.join(process.cwd(), "dist", pdfjsFolder);
        }
        const pdfjsFullPathname = path.normalize(`${folderPath}/${pdfjsUrlPathname}`);
        const fileExtension = path.extname(pdfjsFullPathname);
        debug("PDFJS full path name :", pdfjsFullPathname);

        const contentLength = `${fs.statSync(pdfjsFullPathname)?.size || 0}`;
        headers["Content-Length"] = contentLength;
        const contentType = `${findMimeTypeWithExtension(fileExtension) || ""}; charset=utf-8`;
        headers["Content-Type"] = contentType;
        debug("PDFJS content-type:", contentType, contentLength);
        const obj = {
            // NodeJS.ReadableStream
            data: fs.createReadStream(pdfjsFullPathname),
            headers,
            statusCode: 200,
        };
        callback(obj);
        return;
    } else if (isPublicationAssets || isMediaOverlays) {
        let b64Path = uPathname.substr(publicationAssetsPrefix.length);
        const i = b64Path.indexOf("/");
        let pathInZip = "";
        if (i >= 0) {
            pathInZip = b64Path.substr(i + 1);
            b64Path = b64Path.substr(0, i);
        }
        b64Path = decodeURIComponent(b64Path);

        debug("streamProtocolHandler b64Path", b64Path);
        debug("streamProtocolHandler pathInZip", pathInZip);

        if (!pathInZip) {
            const err = "PATH IN ZIP?? " + uPathname;
            debug(err);
            const buff = Buffer.from("<html><body><p>Internal Server Error</p><p>" + err + "</p></body></html>");
            headers["Content-Length"] = buff.length.toString();
            const obj = {
                // NodeJS.ReadableStream
                data: bufferToStream(buff),
                headers,
                statusCode: 500,
            };
            callback(obj);
            return;
        }

        const pathBase64Str = Buffer.from(b64Path, "base64").toString("utf8");

        // const fileName = path.basename(pathBase64Str);
        // const ext = path.extname(fileName).toLowerCase();

        let publication: R2Publication;
        try {
            publication = await streamerLoadOrGetCachedPublication(pathBase64Str);
        } catch (err) {
            debug(err);
            const buff = Buffer.from("<html><body><p>Internal Server Error</p><p>" + err + "</p></body></html>");
            headers["Content-Length"] = buff.length.toString();
            const obj = {
                // NodeJS.ReadableStream
                data: bufferToStream(buff),
                headers,
                statusCode: 500,
            };
            callback(obj);
            return;
        }

        if (isMediaOverlays) {
            let objToSerialize: any = null;

            // decodeURIComponent already done
            const resource = u.searchParams.get(mediaOverlayURLParam) || undefined;
            debug("streamProtocolHandler MO resource", resource);

            if (resource && resource !== "all") {
                try {
                    objToSerialize = await getMediaOverlay(publication, resource);
                } catch (err) {
                    debug(err);
                    const buff =
                        Buffer.from("<html><body><p>Internal Server Error</p><p>" + err + "</p></body></html>");
                    headers["Content-Length"] = buff.length.toString();
                    const objz = {
                        // NodeJS.ReadableStream
                        data: bufferToStream(buff),
                        headers,
                        statusCode: 500,
                    };
                    callback(objz);
                    return;
                }
            } else {
                try {
                    objToSerialize = await getAllMediaOverlays(publication);
                } catch (err) {
                    debug(err);
                    const buff =
                        Buffer.from("<html><body><p>Internal Server Error</p><p>" + err + "</p></body></html>");
                    headers["Content-Length"] = buff.length.toString();
                    const objz = {
                        // NodeJS.ReadableStream
                        data: bufferToStream(buff),
                        headers,
                        statusCode: 500,
                    };
                    callback(objz);
                    return;
                }
            }

            if (!objToSerialize) {
                objToSerialize = [];
            }
            debug("streamProtocolHandler objToSerialize", objToSerialize);

            const jsonObj = TaJsonSerialize(objToSerialize);
            // jsonObj = { "media-overlay": jsonObj };

            const jsonStr = global.JSON.stringify(jsonObj, null, "  ");

            const checkSum = crypto.createHash("sha256");
            checkSum.update(jsonStr);
            const hash = checkSum.digest("hex");

            const match = req.headers["If-None-Match"];
            if (match === hash) {
                debug("streamProtocolHandler smil cache");
                const obj: ProtocolResponse = {
                    // NodeJS.ReadableStream
                    data: null,
                    headers,
                    statusCode: 304, // StatusNotModified,
                };
                callback(obj);
                return;
            }

            headers["Content-Type"] = "application/vnd.syncnarr+json; charset=utf-8";

            headers.ETag = hash;
            // headers["Cache-Control"] = "public,max-age=86400";

            if (isHead) {
                debug("streamProtocolHandler smil HEAD RESPONSE HEADERS: ", headers);

                const obj: ProtocolResponse = {
                    // NodeJS.ReadableStream
                    data: null,
                    headers,
                    statusCode: 200,
                };
                callback(obj);
            } else {
                const buff = Buffer.from(jsonStr);
                headers["Content-Length"] = buff.length.toString();

                debug("streamProtocolHandler smil GET RESPONSE HEADERS: ", headers);

                const obj: ProtocolResponse = {
                    // NodeJS.ReadableStream
                    data: bufferToStream(buff),
                    headers,
                    statusCode: 200,
                };
                callback(obj);
            }
            return;
        }

        if (pathInZip === "manifest.json") {

            const rootUrl = "THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL://0.0.0.0/pub/" + encodeURIComponent_RFC3986(b64Path);
            const manifestURL = rootUrl + "/" + "manifest.json";

            const contentType =
                (publication.Metadata && publication.Metadata.RDFType &&
                    /http[s]?:\/\/schema\.org\/Audiobook$/.test(publication.Metadata.RDFType)) ?
                    "application/audiobook+json" : ((publication.Metadata && publication.Metadata.RDFType &&
                        (/http[s]?:\/\/schema\.org\/ComicStory$/.test(publication.Metadata.RDFType) ||
                            /http[s]?:\/\/schema\.org\/VisualNarrative$/.test(publication.Metadata.RDFType))) ? "application/divina+json" :
                        "application/webpub+json");

            const selfLink = publication.searchLinkByRel("self");
            if (!selfLink) {
                publication.AddLink(contentType, ["self"], manifestURL, undefined);
            }

            function absoluteURL(href: string): string {
                return rootUrl + "/" + href;
            }

            let hasMO = false;
            if (publication.Spine) {
                const linkk = publication.Spine.find((l) => {
                    if (l.Properties && l.Properties.MediaOverlay) {
                        return true;
                    }
                    return false;
                });
                if (linkk) {
                    hasMO = true;
                }
            }
            if (hasMO) {
                const moLink = publication.searchLinkByRel("media-overlay");
                if (!moLink) {
                    const moURL = // rootUrl + "/" +
                        mediaOverlayURLPath +
                        "?" + mediaOverlayURLParam + "={path}";
                    publication.AddLink("application/vnd.syncnarr+json", ["media-overlay"], moURL, true);
                }
            }

            let coverImage: string | undefined;
            const coverLink = publication.GetCover();
            if (coverLink) {
                coverImage = coverLink.Href;
                if (coverImage && !isHTTP(coverImage)) {
                    coverImage = absoluteURL(coverImage);
                }
            }

            headers["Content-Type"] = `${contentType}; charset=utf-8`;

            const publicationJsonObj = TaJsonSerialize(publication);

            // absolutizeURLs(publicationJsonObj);

            const publicationJsonStr = global.JSON.stringify(publicationJsonObj, null, "  ");

            const checkSum = crypto.createHash("sha256");
            checkSum.update(publicationJsonStr);
            const hash = checkSum.digest("hex");

            const match = req.headers["If-None-Match"];
            if (match === hash) {
                debug("streamProtocolHandler manifest.json cache");
                const obj: ProtocolResponse = {
                    // NodeJS.ReadableStream
                    data: null,
                    headers,
                    statusCode: 304, // StatusNotModified,
                };
                callback(obj);
                return;
            }

            headers.ETag = hash;
            // headers["Cache-Control"] = "public,max-age=86400";

            const links = getPreFetchResources(publication);
            if (links && links.length) {
                let n = 0;
                let prefetch = "";
                for (const l of links) {
                    n++;
                    if (n > MAX_PREFETCH_LINKS) {
                        break;
                    }
                    const href = absoluteURL(l.Href);
                    prefetch += "<" + href + ">;" + "rel=prefetch,";
                }
                headers.Link = prefetch;
            }

            if (isHead) {
                debug("streamProtocolHandler manifest HEAD RESPONSE HEADERS: ", headers);

                const obj: ProtocolResponse = {
                    // NodeJS.ReadableStream
                    data: null,
                    headers,
                    statusCode: 200,
                };
                callback(obj);
            } else {
                const buff = Buffer.from(publicationJsonStr);
                headers["Content-Length"] = buff.length.toString();

                debug("streamProtocolHandler manifest GET RESPONSE HEADERS: ", headers);

                const obj: ProtocolResponse = {
                    // NodeJS.ReadableStream
                    data: bufferToStream(buff),
                    headers,
                    statusCode: 200,
                };
                callback(obj);
            }

            return;
        }

        const zipInternal = publication.findFromInternal("zip");
        if (!zipInternal) {
            const err = "No publication zip!";
            debug(err);
            const buff = Buffer.from("<html><body><p>Internal Server Error</p><p>" + err + "</p></body></html>");
            headers["Content-Length"] = buff.length.toString();
            const obj = {
                // NodeJS.ReadableStream
                data: bufferToStream(buff),
                headers,
                statusCode: 500,
            };
            callback(obj);
            return;
        }
        const zip = zipInternal.Value as IZip;

        if (!zipHasEntry(zip, pathInZip, undefined)) {
            const err = "Asset not in zip! " + pathInZip;
            debug(err);
            const buff = Buffer.from("<html><body><p>Internal Server Error</p><p>" + err + "</p></body></html>");
            headers["Content-Length"] = buff.length.toString();
            const obj = {
                // NodeJS.ReadableStream
                data: bufferToStream(buff),
                headers,
                statusCode: 500,
            };
            callback(obj);
            return;
        }

        const isDivina = publication.Metadata && publication.Metadata.RDFType &&
            (/http[s]?:\/\/schema\.org\/ComicStory$/.test(publication.Metadata.RDFType) ||
                /http[s]?:\/\/schema\.org\/VisualNarrative$/.test(publication.Metadata.RDFType));

        let link: Link | undefined;

        const findLinkRecursive = (relativePath: string, l: Link): Link | undefined => {
            if (l.Href === relativePath) {
                return l;
            }
            let found: Link | undefined;
            if (l.Children) {
                for (const child of l.Children) {
                    found = findLinkRecursive(relativePath, child);
                    if (found) {
                        return found;
                    }
                }
            }
            if (l.Alternate) {
                for (const alt of l.Alternate) {
                    found = findLinkRecursive(relativePath, alt);
                    if (found) {
                        return found;
                    }
                }
            }
            return undefined;
        };

        if ((publication.Resources || publication.Spine || publication.Links)
            && pathInZip.indexOf("META-INF/") !== 0
            && !pathInZip.endsWith(".opf")) {

            const relativePath = pathInZip;

            if (publication.Resources) {
                for (const l of publication.Resources) {
                    link = findLinkRecursive(relativePath, l);
                    if (link) {
                        break;
                    }
                }
            }
            if (!link) {
                if (publication.Spine) {
                    for (const l of publication.Spine) {
                        link = findLinkRecursive(relativePath, l);
                        if (link) {
                            break;
                        }
                    }
                }
            }
            if (!link) {
                if (publication.Links) {
                    for (const l of publication.Links) {
                        link = findLinkRecursive(relativePath, l);
                        if (link) {
                            break;
                        }
                    }
                }
            }
            if (!link &&
                !isDivina) {
                const err = "Asset not declared in publication spine/resources! " + relativePath;
                debug(err);
                const buff = Buffer.from("<html><body><p>Internal Server Error</p><p>" + err + "</p></body></html>");
                headers["Content-Length"] = buff.length.toString();
                const obj = {
                    // NodeJS.ReadableStream
                    data: bufferToStream(buff),
                    headers,
                    statusCode: 500,
                };
                callback(obj);
                return;
            }
        }

        let mediaType = mime.lookup(pathInZip) || "stream/octet";
        if (link && link.TypeLink) {
            mediaType = link.TypeLink;
        }
        debug("streamProtocolHandler mediaType", mediaType);

        // const isText = (typeof mediaType === "string") && (
        //     mediaType.indexOf("text/") === 0 ||
        //     mediaType.indexOf("application/xhtml") === 0 ||
        //     mediaType.indexOf("application/xml") === 0 ||
        //     mediaType.indexOf("application/json") === 0 ||
        //     mediaType.indexOf("application/svg") === 0 ||
        //     mediaType.indexOf("application/smil") === 0 ||
        //     mediaType.indexOf("+json") > 0 ||
        //     mediaType.indexOf("+smil") > 0 ||
        //     mediaType.indexOf("+svg") > 0 ||
        //     mediaType.indexOf("+xhtml") > 0 ||
        //     mediaType.indexOf("+xml") > 0);

        // const isVideoAudio = mediaType && (
        //     mediaType.indexOf("audio/") === 0 ||
        //     mediaType.indexOf("video/") === 0);
        // if (isVideoAudio) {
        //     debug(req.headers);
        // }

        const isEncrypted = link && link.Properties && link.Properties.Encrypted;
        // const isObfuscatedFont = isEncrypted && link &&
        //     (link.Properties.Encrypted.Algorithm === "http://ns.adobe.com/pdf/enc#RC"
        //         || link.Properties.Encrypted.Algorithm === "http://www.idpf.org/2008/embedding");
        debug("streamProtocolHandler isEncrypted", isEncrypted);

        const isPartialByteRangeRequest = ((req.headers && req.headers.Range) ? true : false);
        debug("streamProtocolHandler isPartialByteRangeRequest", isPartialByteRangeRequest);

        // if (isEncrypted && isPartialByteRangeRequest) {
        //     const err = "Encrypted video/audio not supported (HTTP 206 partial request byte range)";
        //     debug(err);
        //     res.status(500).send("<html><body><p>Internal Server Error</p><p>"
        //         + err + "</p></body></html>");
        //     return;
        // }

        let partialByteBegin = 0; // inclusive boundaries
        let partialByteEnd = -1;
        if (isPartialByteRangeRequest) {
            debug("streamProtocolHandler isPartialByteRangeRequest", req.headers.Range);

            const ranges = parseRangeHeader(req.headers.Range);
            // debug(ranges);

            if (ranges && ranges.length) {
                if (ranges.length > 1) {
                    const err = "Too many HTTP ranges: " + req.headers.Range;
                    debug(err);
                    const buff =
                        Buffer.from("<html><body><p>Internal Server Error</p><p>" + err + "</p></body></html>");
                    headers["Content-Length"] = buff.length.toString();
                    // headers["Content-Range"] = `*/${contentLength}`;
                    const obj = {
                        // NodeJS.ReadableStream
                        data: bufferToStream(buff),
                        headers,
                        statusCode: 416,
                    };
                    callback(obj);
                    return;
                }
                partialByteBegin = ranges[0].begin;
                partialByteEnd = ranges[0].end;

                if (partialByteBegin < 0) {
                    partialByteBegin = 0;
                }
            }

            debug("streamProtocolHandler isPartialByteRangeRequest", `${pathInZip} >> ${partialByteBegin}-${partialByteEnd}`);
        }
        let zipStream_: IStreamAndLength;
        try {
            zipStream_ = isPartialByteRangeRequest && !isEncrypted ?
                await zip.entryStreamRangePromise(pathInZip, partialByteBegin, partialByteEnd) :
                await zip.entryStreamPromise(pathInZip);
        } catch (err) {
            debug(err);
            const buff = Buffer.from("<html><body><p>Internal Server Error</p><p>" + err + "</p></body></html>");
            headers["Content-Length"] = buff.length.toString();
            const obj = {
                // NodeJS.ReadableStream
                data: bufferToStream(buff),
                headers,
                statusCode: 500,
            };
            callback(obj);
            return;
        }

        // The HTML transforms are chained here too, so cannot check server.disableDecryption at this level!
        const doTransform = true; // !isEncrypted || (isObfuscatedFont || !server.disableDecryption);

        // decodeURIComponent already done
        const sessionInfo = u.searchParams.get(URL_PARAM_SESSION_INFO) || undefined;
        debug("streamProtocolHandler sessionInfo", sessionInfo);

        if (doTransform && link) {

            const fullUrl = req.url; // `${THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL}://0.0.0.0${uPathname}`;

            let transformedStream: IStreamAndLength;
            try {
                transformedStream = await Transformers.tryStream(
                    publication,
                    link,
                    fullUrl,
                    zipStream_,
                    isPartialByteRangeRequest,
                    partialByteBegin,
                    partialByteEnd,
                    sessionInfo,
                );
            } catch (err) {
                debug(err);
                const buff = Buffer.from("<html><body><p>Internal Server Error</p><p>" + err + "</p></body></html>");
                headers["Content-Length"] = buff.length.toString();
                const obj = {
                    // NodeJS.ReadableStream
                    data: bufferToStream(buff),
                    headers,
                    statusCode: 500,
                };
                callback(obj);
                return;
            }
            if (transformedStream) {
                if (transformedStream !== zipStream_) {
                    debug("streamProtocolHandler Asset transformed ok", link.Href);
                }
                zipStream_ = transformedStream; // can be unchanged
            } else {
                const err = "Transform fail (encryption scheme not supported?)";
                debug(err);
                const buff = Buffer.from("<html><body><p>Internal Server Error</p><p>" + err + "</p></body></html>");
                headers["Content-Length"] = buff.length.toString();
                const obj = {
                    // NodeJS.ReadableStream
                    data: bufferToStream(buff),
                    headers,
                    statusCode: 500,
                };
                callback(obj);
                return;
            }
        }

        if (isPartialByteRangeRequest) {
            headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
            headers.Pragma = "no-cache";
            headers.Expires = "0";
        } else {
            headers["Cache-Control"] = "public,max-age=86400";
        }

        if (mediaType) {
            headers["Content-Type"] = mediaType;
            // res.type(mediaType);
        }

        headers["Accept-Ranges"] = "bytes";

        let statusCode = 200;
        if (isPartialByteRangeRequest) {
            if (partialByteEnd < 0) {
                partialByteEnd = zipStream_.length - 1;
            }
            const partialByteLength = isPartialByteRangeRequest ?
                partialByteEnd - partialByteBegin + 1 :
                zipStream_.length;
            // res.setHeader("Connection", "close");
            // res.setHeader("Transfer-Encoding", "chunked");
            headers["Content-Length"] = `${partialByteLength}`;
            const rangeHeader = `bytes ${partialByteBegin}-${partialByteEnd}/${zipStream_.length}`;
            debug("streamProtocolHandler +++> " + rangeHeader + " (( " + partialByteLength);
            headers["Content-Range"] = rangeHeader;
            statusCode = 206;
        } else {
            headers["Content-Length"] = `${zipStream_.length}`;
            debug("streamProtocolHandler ---> " + zipStream_.length);
            statusCode = 200;
        }

        if (isHead) {
            debug("streamProtocolHandler HEAD RESPONSE HEADERS: ", headers);
            const obj: ProtocolResponse = {
                // NodeJS.ReadableStream
                data: null,
                headers,
                statusCode,
            };
            callback(obj);
        } else {
            debug("streamProtocolHandler GET RESPONSE HEADERS: ", headers);
            const obj = {
                // NodeJS.ReadableStream
                data: zipStream_.stream,
                headers,
                statusCode,
            };
            callback(obj);
        }
    } else if (isMathJax || isReadiumCSS) {

        const p = path.join(isReadiumCSS ? READIUMCSS_FILE_PATH : MATHJAX_FILE_PATH,
            uPathname.substr((isReadiumCSS ? readiumCssPrefix : mathJaxPrefix).length));
        debug("streamProtocolHandler isMathJax || isReadiumCSS", p);

        if (!fs.existsSync(p)) {
            const err = "404 NOT FOUND: " + p;
            debug(err);
            const buff = Buffer.from("<html><body><p>Internal Server Error</p><p>" + err + "</p></body></html>");
            headers["Content-Length"] = buff.length.toString();
            const objz = {
                // NodeJS.ReadableStream
                data: bufferToStream(buff),
                headers,
                statusCode: 404,
            };
            callback(objz);
            return;
        }
        fs.readFile(p, (e, buffer) => {
            if (e) {
                const err = e + " :ERROR: " + p;
                debug(err);
                const buff = Buffer.from("<html><body><p>Internal Server Error</p><p>" + err + "</p></body></html>");
                headers["Content-Length"] = buff.length.toString();
                const objz = {
                    // NodeJS.ReadableStream
                    data: bufferToStream(buff),
                    headers,
                    statusCode: 500,
                };
                callback(objz);
                return;
            }

            const mediaType = mime.lookup(p) || "stream/octet";
            headers["Content-Type"] = mediaType;

            const checkSum = crypto.createHash("sha256");
            checkSum.update(buffer);
            const hash = checkSum.digest("hex");

            const match = req.headers["If-None-Match"];
            if (match === hash) {
                debug("streamProtocolHandler cached: " + p);
                const obj_: ProtocolResponse = {
                    // NodeJS.ReadableStream
                    data: null,
                    headers,
                    statusCode: 304, // StatusNotModified,
                };
                callback(obj_);
                return;
            }

            headers.ETag = hash;
            // headers["Cache-Control"] = "public,max-age=86400";

            headers["Content-Length"] = buffer.length.toString();

            debug("streamProtocolHandler MATHJAX / READIUMCSS RESPONSE HEADERS: ", headers);
            const obj: ProtocolResponse = {
                // NodeJS.ReadableStream
                data: bufferToStream(buffer),
                headers,
                statusCode: 200,
            };
            callback(obj);
        });
    } else {
        const err = "NOPE :( " + uPathname;
        debug(err);
        const buff = Buffer.from("<html><body><p>Internal Server Error</p><p>" + err + "</p></body></html>");
        headers["Content-Length"] = buff.length.toString();
        const obj = {
            // NodeJS.ReadableStream
            data: bufferToStream(buff),
            headers,
            statusCode: 404,
        };
        callback(obj);
    }
};

const transformerIFrames: TTransformFunction = (
    _publication: R2Publication,
    link: Link,
    url: string | undefined,
    htmlStr: string,
    _sessionInfo: string | undefined,
): string => {
    // super hacky! (guarantees that convertCustomSchemeToHttpUrl() is necessary,
    // unlike this `url` function parameter which is always HTTP as it originates
    // from the streamer/server)
    if (!_customUrlProtocolSchemeHandlerWasCalled) {
        return htmlStr;
    }

    if (!url) {
        return htmlStr;
    }

    if (htmlStr.indexOf("<iframe") < 0) {
        return htmlStr;
    }

    // let's remove the DOCTYPE (which can contain entities)

    const iHtmlStart = htmlStr.indexOf("<html");
    if (iHtmlStart < 0) {
        return htmlStr;
    }
    const iBodyStart = htmlStr.indexOf("<body");
    if (iBodyStart < 0) {
        return htmlStr;
    }
    const parseableChunk = htmlStr.substr(iHtmlStart);
    const htmlStrToParse = `<?xml version="1.0" encoding="utf-8"?>${parseableChunk}`;

    // import * as mime from "mime-types";
    let mediaType = "application/xhtml+xml"; // mime.lookup(link.Href);
    if (link && link.TypeLink) {
        mediaType = link.TypeLink;
    }

    // debug(htmlStrToParse);
    const documant = parseDOM(htmlStrToParse, mediaType);

    // debug(url);
    let urlHttp = url;
    if (!urlHttp.startsWith(READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) {
        // urlHttp = convertCustomSchemeToHttpUrl(urlHttp);
        urlHttp = convertHttpUrlToCustomScheme(urlHttp);
    }
    const url_ = new URL(urlHttp);

    // const r2_GOTO = url_.searchParams.get(URL_PARAM_GOTO);
    // const r2_GOTO_DOM_RANGE = url_.searchParams.get(URL_PARAM_GOTO_DOM_RANGE);
    // const r2_REFRESH = url_.searchParams.get(URL_PARAM_REFRESH);
    const r2CSS = url_.searchParams.get(URL_PARAM_CSS);
    const r2ERS = url_.searchParams.get(URL_PARAM_EPUBREADINGSYSTEM);
    const r2DEBUG = url_.searchParams.get(URL_PARAM_DEBUG_VISUALS);
    const r2CLIPBOARDINTERCEPT = url_.searchParams.get(URL_PARAM_CLIPBOARD_INTERCEPT);
    const r2SESSIONINFO = url_.searchParams.get(URL_PARAM_SESSION_INFO);
    const r2WEBVIEWSLOT = url_.searchParams.get(URL_PARAM_WEBVIEW_SLOT);
    const r2SECONDWEBVIEW = url_.searchParams.get(URL_PARAM_SECOND_WEBVIEW);

    url_.search = "";
    url_.hash = "";
    const urlStr = url_.toString();
    // debug(urlStr);

    const patchElementSrc = (el: Element) => {
        const src = el.getAttribute("src");
        if (!src || src[0] === "/" ||
            /^http[s]?:\/\//.test(src) || /^data:\/\//.test(src)) {
            return;
        }
        let src_ = src;
        if (src_.startsWith("./")) {
            src_ = src_.substr(2);
        }
        src_ = `${urlStr}/../${src_}`;
        const iframeUrl = new URL(src_);

        if (r2CLIPBOARDINTERCEPT) {
            iframeUrl.searchParams.append(URL_PARAM_CLIPBOARD_INTERCEPT, r2CLIPBOARDINTERCEPT);
        }
        if (r2SESSIONINFO) {
            iframeUrl.searchParams.append(URL_PARAM_SESSION_INFO, r2SESSIONINFO);
        }
        if (r2DEBUG) {
            iframeUrl.searchParams.append(URL_PARAM_DEBUG_VISUALS, r2DEBUG);
        }
        if (r2ERS) {
            iframeUrl.searchParams.append(URL_PARAM_EPUBREADINGSYSTEM, r2ERS);
        }
        if (r2CSS) {
            iframeUrl.searchParams.append(URL_PARAM_CSS, r2CSS);
        }
        if (r2WEBVIEWSLOT) {
            iframeUrl.searchParams.append(URL_PARAM_WEBVIEW_SLOT, r2WEBVIEWSLOT);
        }
        if (r2SECONDWEBVIEW) {
            iframeUrl.searchParams.append(URL_PARAM_SECOND_WEBVIEW, r2SECONDWEBVIEW);
        }

        iframeUrl.searchParams.append(URL_PARAM_IS_IFRAME, "1");
        // debug(iframeUrl.search);

        src_ = iframeUrl.toString();
        debug(`IFRAME SRC PATCH: ${src} ==> ${src_}`);
        el.setAttribute("src", src_);
    };
    const processTree = (el: Element) => {
        const elName = el.nodeName.toLowerCase();
        if (elName === "iframe") {
            patchElementSrc(el);
        } else {
            if (!el.childNodes) {
                return;
            }
            // tslint:disable-next-line: prefer-for-of
            for (let i = 0; i < el.childNodes.length; i++) {
                const childNode = el.childNodes[i];
                if (childNode.nodeType === 1) { // Node.ELEMENT_NODE
                    processTree(childNode as Element);
                }
            }
        }
    };
    processTree(documant.body);

    const serialized = serializeDOM(documant);

    const prefix = htmlStr.substr(0, iHtmlStart);

    const iHtmlStart_ = serialized.indexOf("<html");
    if (iHtmlStart_ < 0) {
        return htmlStr;
    }

    const remaining = serialized.substr(iHtmlStart_);
    const newStr = `${prefix}${remaining}`;
    // debug(newStr);
    return newStr;
};

export function initSessions() {
    app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
    app.commandLine.appendSwitch("enable-speech-dispatcher");

    Transformers.instance().add(new TransformerHTML(transformerIFrames));

    protocol.registerSchemesAsPrivileged([
        // HACK!! TODO: FIXME (Electron lifecycle requires this before app.ready, and called only once!)
        // see src/main/redux/sagas/getEventChannel.ts
    {
        privileges: {
            allowServiceWorkers: false, // Default false
            bypassCSP: false, // Default false
            corsEnabled: false, // Default false
            secure: true, // Default false
            stream: true, // Default false
            supportFetchAPI: false, // Default false
            standard: false, // Default false
            codeCache: false, // Default false (only works with standard=true)
        },
        scheme: "store",
    },
    {
        privileges: {
            allowServiceWorkers: false, // Default false
            bypassCSP: false, // Default false
            corsEnabled: false, // Default false
            secure: true, // Default false
            stream: true, // Default false
            supportFetchAPI: false, // Default false
            standard: false, // Default false
            codeCache: false, // Default false (only works with standard=true)
        },
        scheme: "pdfjs-extract",
    },
    {
        privileges: {
            allowServiceWorkers: false, // Default false
            bypassCSP: true, // Default false
            corsEnabled: false, // Default false
            secure: true, // Default false
            stream: true, // Default false
            supportFetchAPI: false, // Default false
            standard: false, // Default false
            codeCache: false, // Default false (only works with standard=true)
        },
        scheme: OPDS_MEDIA_SCHEME,
    },
    {
        privileges: {
            allowServiceWorkers: false,
            bypassCSP: false,
            corsEnabled: true,
            secure: true,
            stream: true,
            supportFetchAPI: true,
            standard: true, // Default false
            codeCache: false, // Default false (only works with standard=true)
        },
        scheme: THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL,
    }, {
        privileges: {
            allowServiceWorkers: false,
            bypassCSP: false,
            corsEnabled: true,
            secure: true,
            stream: true,
            supportFetchAPI: true,
            standard: true, // Default false
            codeCache: false, // Default false (only works with standard=true)
        },
        scheme: READIUM2_ELECTRON_HTTP_PROTOCOL,
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
                streamProtocolHandler);
            session.defaultSession.protocol.registerStreamProtocol(
                READIUM2_ELECTRON_HTTP_PROTOCOL,
                streamProtocolHandlerTunnel);
        }
        const webViewSession = getWebViewSession();
        if (webViewSession) {
            webViewSession.protocol.registerStreamProtocol(
                THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL,
                streamProtocolHandler);

            webViewSession.protocol.registerStreamProtocol(
                READIUM2_ELECTRON_HTTP_PROTOCOL,
                streamProtocolHandlerTunnel);

            webViewSession.setPermissionRequestHandler((wc, permission, callback) => {
                debug("setPermissionRequestHandler");
                debug(wc.getURL());
                debug(permission);
                callback(true);
            });
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
