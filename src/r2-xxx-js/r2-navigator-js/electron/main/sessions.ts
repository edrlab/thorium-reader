// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import {
    // BeforeSendResponse, HeadersReceivedResponse, OnBeforeSendHeadersListenerDetails,
    // OnHeadersReceivedListenerDetails, ProtocolRequest, ProtocolResponse, Request, app, protocol,
    session,
} from "electron";
// import * as request from "request";
// // import * as requestPromise from "request-promise-native";

// import { Publication } from "@r2-shared-js/models/publication";
// import { Link } from "@r2-shared-js/models/publication-link";
// import { Transformers } from "@r2-shared-js/transform/transformer";
// import { TTransformFunction, TransformerHTML } from "@r2-shared-js/transform/transformer-html";
// import { Server } from "@r2-streamer-js/http/server";

// import { parseDOM, serializeDOM } from "../common/dom";
import {
    R2_SESSION_WEBVIEW,
    // READIUM2_ELECTRON_HTTP_PROTOCOL, convertCustomSchemeToHttpUrl, convertHttpUrlToCustomScheme,
} from "../common/sessions";
// import {
//     URL_PARAM_A11Y_SUPPORT_ENABLED,
//     URL_PARAM_CLIPBOARD_INTERCEPT, URL_PARAM_CSS, URL_PARAM_DEBUG_VISUALS,
//     URL_PARAM_EPUBMEDIAOVERLAYS,
//     URL_PARAM_EPUBREADINGSYSTEM, URL_PARAM_IS_IFRAME, URL_PARAM_SECOND_WEBVIEW,
//     URL_PARAM_SESSION_INFO, URL_PARAM_WEBVIEW_SLOT,
// } from "../renderer/common/url-params";

// import { PassThrough } from "stream";
// import { CounterPassThroughStream } from "@r2-utils-js/_utils/stream/CounterPassThroughStream";

const debug = debug_("r2:navigator#electron/main/sessions");

// const USE_STREAM_PROTOCOL_INSTEAD_OF_HTTP = true;

interface PromiseFulfilled<T> {
    status: "fulfilled";
    value: T;
}
interface PromiseRejected {
    status: "rejected";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reason: any;
}

async function promiseAllSettled<T>(promises: Array<Promise<T>>):
    Promise<Array<(PromiseFulfilled<T> | PromiseRejected)>> {

    const promises_ = promises.map(async (promise) => {
        return promise
            .then<PromiseFulfilled<T>>((value) => {
                return {
                    status: "fulfilled",
                    value,
                };
            })
            .catch((reason) => {
                return {
                    reason,
                    status: "rejected",
                } as PromiseRejected;
            });
    });
    return Promise.all(promises_);
}

// let _server: Server | undefined; // hacky (global reference context used in streamProtocolHandler callback)
// export function secureSessions(server: Server) {
//     _server = server;

//     const filter = { urls: ["*://*/*"] };

//     const onHeadersReceivedCB = (
//         details: OnHeadersReceivedListenerDetails,
//         callback: (headersReceivedResponse: HeadersReceivedResponse) => void) => {

//         // debug("onHeadersReceived");
//         // debug(details);

//         if (!details.url) {
//             callback({});
//             return;
//         }

//         const serverUrl = server.serverUrl();

//         if ((serverUrl && details.url.startsWith(serverUrl)) ||
//             details.url.startsWith(READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) {

//             callback({
//                 cancel: false,
//                 responseHeaders: {
//                     ...details.responseHeaders,
//                     // https://github.com/electron/electron/blob/master/docs/tutorial/security.md#csp-http-header
//                     "Content-Security-Policy":
//                         // tslint:disable-next-line:max-line-length
//                         [`default-src 'self' 'unsafe-inline' 'unsafe-eval' data: http: https: ${READIUM2_ELECTRON_HTTP_PROTOCOL}: ${serverUrl}`],
//                 },
//                 // statusLine
//             });
//         } else {
//             // HTTP headers passthrough
//             // https://github.com/electron/electron/issues/23988
//             callback({
//                 cancel: false,
//                 responseHeaders: {
//                     ...details.responseHeaders,
//                 },
//                 // statusLine
//             });
//         }
//     };

//     const onBeforeSendHeadersCB = (
//         details: OnBeforeSendHeadersListenerDetails,
//         callback: (beforeSendResponse: BeforeSendResponse) => void) => {

//         // debug("onBeforeSendHeaders");
//         // debug(details);

//         // details.requestHeaders["User-Agent"] = "R2 Electron";

//         if (!details.url) {
//             callback({});
//             return;
//         }

//         const serverUrl = server.serverUrl();

//         if (server.isSecured() &&
//             ((serverUrl && details.url.startsWith(serverUrl)) ||
//                 details.url.startsWith(READIUM2_ELECTRON_HTTP_PROTOCOL + "://"))) {

//             const header = server.getSecureHTTPHeader(details.url);
//             if (header) {
//                 details.requestHeaders[header.name] = header.value;
//             }
//             callback({
//                 cancel: false,
//                 requestHeaders: {
//                     ...details.requestHeaders,
//                 },
//             });
//         } else {
//             // HTTP headers passthrough
//             // https://github.com/electron/electron/issues/23988
//             callback({
//                 cancel: false,
//                 requestHeaders: {
//                     ...details.requestHeaders,
//                 },
//             });
//         }
//     };

//     // https://github.com/electron/electron/blob/v3.0.0/docs/api/breaking-changes.md#session
//     const setCertificateVerifyProcCB = (
//         req: Request,
//         callback: (verificationResult: number) => void) => {
//         // debug("setCertificateVerifyProc");
//         // debug(req);

//         if (server.isSecured()) {
//             const info = server.serverInfo();
//             if (info) {
//                 // debug(info);
//                 if (req.hostname === info.urlHost) {
//                     callback(0); // OK
//                     return;
//                 }
//             }
//         }
//         callback(-3); // Chromium
//         // callback(-2); // Fail
//     };

//     if (session.defaultSession) {
//         session.defaultSession.webRequest.onHeadersReceived(filter, onHeadersReceivedCB);
//         session.defaultSession.webRequest.onBeforeSendHeaders(filter, onBeforeSendHeadersCB);
//         session.defaultSession.setCertificateVerifyProc(setCertificateVerifyProcCB);
//     }

//     const webViewSession = getWebViewSession();
//     if (webViewSession) {
//         webViewSession.webRequest.onHeadersReceived(filter, onHeadersReceivedCB);
//         webViewSession.webRequest.onBeforeSendHeaders(filter, onBeforeSendHeadersCB);
//         webViewSession.setCertificateVerifyProc(setCertificateVerifyProcCB);
//     }

//     app.on("certificate-error", (event, _webContents, url, _error, _certificate, callback) => {
//         // debug("certificate-error");
//         // debug(url);
//         // debug(_error);
//         // debug(_certificate);

//         if (server.isSecured()) {
//             const info = server.serverInfo();
//             if (info) {
//                 // debug(info);
//                 if (url.indexOf(info.urlScheme + "://" + info.urlHost) === 0) {
//                     // debug("certificate-error: BYPASS");

//                     event.preventDefault();
//                     callback(true);
//                     return;
//                 }
//             }
//         }

//         callback(false);
//     });

//     // app.on("select-client-certificate", (event, _webContents, url, list, callback) => {
//     //     debug("select-client-certificate");
//     //     debug(url);
//     //     debug(list);

//     //     if (server.isSecured()) {
//     //         const info = server.serverInfo();
//     //         if (info) {
//     //             debug(info);
//     //             if (url.indexOf(info.urlScheme + "://" + info.urlHost) === 0) {
//     //                 debug("select-client-certificate: BYPASS");

//     //                 event.preventDefault();
//     //                 callback({ data: info.clientcert } as Certificate);
//     //                 return;
//     //             }
//     //         }
//     //     }

//     //     callback();
//     // });
// }

// // let _streamCounter = 0;

// // super hacky!! :(
// // see usages of this boolean...
// let _customUrlProtocolSchemeHandlerWasCalled = false;

// const streamProtocolHandler = async (
//     req: ProtocolRequest,
//     callback: (resp: (NodeJS.ReadableStream) | (ProtocolResponse)) => void) => {

//     _customUrlProtocolSchemeHandlerWasCalled = true;

//     // debug("streamProtocolHandler:");
//     // debug(req.url);
//     // debug(req.referrer);
//     // debug(req.method);
//     // debug(req.headers);

//     const url = convertCustomSchemeToHttpUrl(req.url);
//     // debug(url);

//     const u = new URL(url);
//     let ref = u.origin;
//     // debug(ref);
//     if (req.referrer && req.referrer.trim()) {
//         ref = req.referrer;
//         // debug(ref);
//     }

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const failure = (err: any) => {
//         debug(err);
//         callback({});
//     };

//     const success = (response: request.RequestResponse) => {

//         const headers: Record<string, (string) | (string[])> = {};
//         Object.keys(response.headers).forEach((header: string) => {
//             const val = response.headers[header];

//             // debug(header + " => " + val);

//             if (val) {
//                 headers[header] = val;
//             }
//         });
//         if (!headers.referer) {
//             headers.referer = ref;
//         }

//         // debug(response);
//         // debug(response.body);

//         if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
//             failure("HTTP CODE " + response.statusCode);
//             return;
//         }

//         // let length = 0;
//         // const lengthStr = response.headers["content-length"];
//         // if (lengthStr) {
//         //     length = parseInt(lengthStr, 10);
//         // }
//         // const counterStream = new CounterPassThroughStream(++_streamCounter);

//         // // https://nodejs.org/es/docs/guides/backpressuring-in-streams/
//         // const stream = new PassThrough({
//         //     // allowHalfOpen // default true
//         //     // readableHighWaterMark: 16384 * 2, // default 16384 bytes
//         //     // writableHighWaterMark: 16384 * 2, // default 16384 bytes
//         //     // autoDestroy // default false
//         //     // emitClose // default true
//         // });
//         response
//             // .on("finish", function h(this: request.Response) {
//             //     debug("RESPONSE FINISH " + url);
//             // })
//             // .on("end", function h(this: request.Response) {
//             //     debug("RESPONSE END " + url);
//             // })
//             // .on("close", function h(this: request.Response) {
//             //     debug("RESPONSE CLOSE " + url);
//             // })
//             .on("error", function h(this: request.Response) {
//                 debug("RESPONSE ERROR " + url);
//             })
//             // .on("pipe", function h(this: request.Response) {
//             //     debug("RESPONSE PIPE " + url);
//             // })
//             // .on("unpipe", function h(this: request.Response) {
//             //     debug("RESPONSE UNPIPE " + url);
//             // })
//             // .on("drain", function h(this: request.Response) {
//             //     debug("RESPONSE DRAIN " + url);
//             // })
//             // .on("pause", function h(this: request.Response) {
//             //     debug("RESPONSE PAUSE " + url);
//             // })
//             // .on("resume", function h(this: request.Response) {
//             //     debug("RESPONSE RESUME " + url);
//             // })
//             // .pipe(counterStream) // readable (response) --> writable (counterStream is duplex)
//             // .on("progress", function f(this: CounterPassThroughStream) {
//             //     debug("CounterPassThroughStream PROGRESS: " +
//             //         this.id + " -- " + this.bytesReceived + " = " + url);
//             // })
//             // .on("finish", function f(this: CounterPassThroughStream) {
//             //     debug("CounterPassThroughStream FINISH: " +
//             //         this.id +
//             //         " -- " + this.bytesReceived + " = " + url);
//             // })
//             // .on("end", function f(this: CounterPassThroughStream) {
//             //     debug("CounterPassThroughStream END: " +
//             //         this.id + " = " + url);
//             // })
//             // .on("close", function f(this: CounterPassThroughStream) {
//             //     debug("CounterPassThroughStream CLOSE: " +
//             //         this.id + " = " + url);
//             // })
//             // .on("error", function f(this: CounterPassThroughStream) {
//             //     debug("CounterPassThroughStream ERROR: " +
//             //         this.id + " = " + url);
//             // })
//             // .on("pipe", function f(this: CounterPassThroughStream) {
//             //     debug("CounterPassThroughStream PIPE: " +
//             //         this.id + " = " + url);
//             // })
//             // .on("unpipe", function f(this: CounterPassThroughStream) {
//             //     debug("CounterPassThroughStream UNPIPE: " +
//             //         this.id + " = " + url);
//             // })
//             // .on("drain", function f(this: CounterPassThroughStream) {
//             //     debug("CounterPassThroughStream DRAIN: " +
//             //         this.id + " = " + url);
//             // })
//             // .on("pause", function f(this: CounterPassThroughStream) {
//             //     debug("CounterPassThroughStream PAUSE: " +
//             //         this.id + " = " + url);
//             // })
//             // .on("resume", function f(this: CounterPassThroughStream) {
//             //     debug("CounterPassThroughStream RESUME: " +
//             //         this.id + " = " + url);
//             // })
//             ;
//         // .pipe(stream)
//         // .on("finish", function h(this: PassThrough) {
//         //     debug("RESPONSE>STREAM FINISH " + url);
//         // })
//         // .on("end", function h(this: PassThrough) {
//         //     debug("RESPONSE>STREAM END " + url);
//         // })
//         // .on("close", function h(this: PassThrough) {
//         //     debug("RESPONSE>STREAM CLOSE " + url);
//         // })
//         // .on("error", function h(this: PassThrough) {
//         //     debug("RESPONSE>STREAM ERROR " + url);
//         // })
//         // .on("pipe", function h(this: PassThrough) {
//         //     debug("RESPONSE>STREAM PIPE " + url);
//         // })
//         // .on("unpipe", function h(this: PassThrough) {
//         //     debug("RESPONSE>STREAM UNPIPE " + url);
//         // })
//         // .on("drain", function h(this: PassThrough) {
//         //     debug("RESPONSE>STREAM DRAIN " + url);
//         // })
//         // .on("pause", function h(this: PassThrough) {
//         //     debug("RESPONSE>STREAM PAUSE " + url);
//         // })
//         // .on("resume", function h(this: PassThrough) {
//         //     debug("RESPONSE>STREAM RESUME " + url);
//         // })
//         // ;

//         const obj = {
//             data: response, // NodeJS.ReadableStream
//             headers,
//             statusCode: response.statusCode,
//         };
//         callback(obj);

//         // let responseStr: string;
//         // if (response.body) {
//         //     debug("RES BODY");
//         //     responseStr = response.body;
//         // } else {
//         //     debug("RES STREAM");
//         //     let responseData: Buffer;
//         //     try {
//         //         responseData = await streamToBufferPromise(response);
//         //     } catch (err) {
//         //         debug(err);
//         //         return;
//         //     }
//         //     responseStr = responseData.toString("utf8");
//         // }
//     };

//     const reqHeaders = req.headers;
//     if (_server) {
//         const serverUrl = _server.serverUrl();

//         if (_server.isSecured() &&
//             ((serverUrl && url.startsWith(serverUrl)) ||
//                 url.startsWith(READIUM2_ELECTRON_HTTP_PROTOCOL + "://"))) {

//             const header = _server.getSecureHTTPHeader(url);
//             if (header) {
//                 reqHeaders[header.name] = header.value;
//             }
//         }
//     }

//     // // No response streaming! :(
//     // // https://github.com/request/request-promise/issues/90
//     // const needsStreamingResponse = true;
//     // if (needsStreamingResponse) {
//         request.get({
//             headers: reqHeaders,
//             method: "GET",
//             rejectUnauthorized: false, // self-signed certificate
//             uri: url,
//         })
//             .on("response", (response: request.RequestResponse) => {
//                 success(response);
//             })
//             // eslint-disable-next-line @typescript-eslint/no-explicit-any
//             .on("error", (err: any) => {
//                 failure(err);
//             });
//     // } else {
//     //     let response: requestPromise.FullResponse;
//     //     try {
//     //         // tslint:disable-next-line:await-promise no-floating-promises
//     //         response = await requestPromise({
//     //             headers: reqHeaders,
//     //             method: "GET",
//     //             rejectUnauthorized: false, // self-signed certificate
//     //             resolveWithFullResponse: true,
//     //             uri: url,
//     //         });
//     //         success(response);
//     //     } catch (err) {
//     //         failure(err);
//     //     }
//     // }
// };
// const httpProtocolHandler = (
//     req: ProtocolRequest,
//     callback: (res: ProtocolResponse) => void) => {

//     _customUrlProtocolSchemeHandlerWasCalled = true;

//     // debug("httpProtocolHandler:");
//     // debug(req.url);
//     // debug(req.referrer);
//     // debug(req.method);
//     // debug(req.headers);

//     const url = convertCustomSchemeToHttpUrl(req.url);
//     // debug(url);

//     callback({
//         method: req.method,
//         session: getWebViewSession(), // session.defaultSession
//         url,
//     });
// };

// // const _htmlNamespaces: { [prefix: string]: string } = {
// //     epub: "http://www.idpf.org/2007/ops",
// // };
// const transformerAudioVideo: TTransformFunction = (
//     _publication: Publication,
//     link: Link,
//     url: string | undefined,
//     htmlStr: string,
//     _sessionInfo: string | undefined,
// ): string => {
//     // super hacky! (guarantees that convertCustomSchemeToHttpUrl() is necessary,
//     // unlike this `url` function parameter which is always HTTP as it originates
//     // from the streamer/server)
//     if (!_customUrlProtocolSchemeHandlerWasCalled) {
//         return htmlStr;
//     }

//     if (!url) {
//         return htmlStr;
//     }

//     if (htmlStr.indexOf("<audio") < 0 && htmlStr.indexOf("<video") < 0) {
//         return htmlStr;
//     }

//     // let's remove the DOCTYPE (which can contain entities)

//     const iHtmlStart = htmlStr.indexOf("<html");
//     if (iHtmlStart < 0) {
//         return htmlStr;
//     }
//     const iBodyStart = htmlStr.indexOf("<body");
//     if (iBodyStart < 0) {
//         return htmlStr;
//     }
//     const parseableChunk = htmlStr.substr(iHtmlStart);
//     const htmlStrToParse = `<?xml version="1.0" encoding="utf-8"?>${parseableChunk}`;

//     // import * as mime from "mime-types";
//     let mediaType = "application/xhtml+xml"; // mime.lookup(link.Href);
//     if (link && link.TypeLink) {
//         mediaType = link.TypeLink;
//     }

//     // debug(htmlStrToParse);
//     const documantFromXmlDom = parseDOM(htmlStrToParse, mediaType);

//     // debug(url);
//     let urlHttp = url;
//     if (urlHttp.startsWith(READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) {
//         urlHttp = convertCustomSchemeToHttpUrl(urlHttp);
//     }
//     const url_ = new URL(urlHttp);
//     url_.search = "";
//     url_.hash = "";
//     const urlStr = url_.toString();
//     // debug(urlStr);

//     const patchElementSrc = (el: Element) => {
//         const src = el.getAttribute("src");
//         if (!src || src[0] === "/" ||
//             /^https?:\/\//.test(src) || /^data:\/\//.test(src)) {
//             return;
//         }
//         let src_ = src;
//         if (src_.startsWith("./")) {
//             src_ = src_.substr(2);
//         }
//         src_ = `${urlStr}/../${src_}`;
//         debug(`VIDEO/AUDIO SRC PATCH: ${src} ==> ${src_}`);
//         el.setAttribute("src", src_);
//     };
//     const processTree = (el: Element) => {
//         let elName = el.nodeName.toLowerCase();
//         if (elName === "audio" || elName === "video") {
//             patchElementSrc(el);

//             if (!el.childNodes) {
//                 return;
//             }
//             // tslint:disable-next-line: prefer-for-of
//             for (let i = 0; i < el.childNodes.length; i++) {
//                 const childNode = el.childNodes[i];
//                 if (childNode.nodeType === 1) { // Node.ELEMENT_NODE
//                     elName = (childNode as Element).nodeName.toLowerCase();
//                     if (elName === "source") {
//                         patchElementSrc(childNode as Element);
//                     }
//                 }
//             }
//         } else {
//             if (!el.childNodes) {
//                 return;
//             }
//             // tslint:disable-next-line: prefer-for-of
//             for (let i = 0; i < el.childNodes.length; i++) {
//                 const childNode = el.childNodes[i];
//                 if (childNode.nodeType === 1) { // Node.ELEMENT_NODE
//                     processTree(childNode as Element);
//                 }
//             }
//         }
//     };
//     processTree(documantFromXmlDom.body);

//     const serialized = serializeDOM(documantFromXmlDom);

//     const prefix = htmlStr.substr(0, iHtmlStart);

//     const iHtmlStart_ = serialized.indexOf("<html");
//     if (iHtmlStart_ < 0) {
//         return htmlStr;
//     }

//     const remaining = serialized.substr(iHtmlStart_);
//     const newStr = `${prefix}${remaining}`;
//     // debug(newStr);
//     return newStr;
// };

// const transformerHttpBaseIframes: TTransformFunction = (
//     _publication: Publication,
//     link: Link,
//     url: string | undefined,
//     htmlStr: string,
//     _sessionInfo: string | undefined,
// ): string => {
//     // super hacky! (guarantees that convertCustomSchemeToHttpUrl() is necessary,
//     // unlike this `url` function parameter which is always HTTP as it originates
//     // from the streamer/server)
//     if (!_customUrlProtocolSchemeHandlerWasCalled) {
//         return htmlStr;
//     }

//     if (!url) {
//         return htmlStr;
//     }

//     if (htmlStr.indexOf("<iframe") < 0) {
//         return htmlStr;
//     }

//     // let's remove the DOCTYPE (which can contain entities)

//     const iHtmlStart = htmlStr.indexOf("<html");
//     if (iHtmlStart < 0) {
//         return htmlStr;
//     }
//     const iBodyStart = htmlStr.indexOf("<body");
//     if (iBodyStart < 0) {
//         return htmlStr;
//     }
//     const parseableChunk = htmlStr.substr(iHtmlStart);
//     const htmlStrToParse = `<?xml version="1.0" encoding="utf-8"?>${parseableChunk}`;

//     // import * as mime from "mime-types";
//     let mediaType = "application/xhtml+xml"; // mime.lookup(link.Href);
//     if (link && link.TypeLink) {
//         mediaType = link.TypeLink;
//     }

//     // debug(htmlStrToParse);
//     const documantFromXmlDom = parseDOM(htmlStrToParse, mediaType);

//     // debug(url);
//     let urlHttp = url;
//     if (!urlHttp.startsWith(READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) {
//         // urlHttp = convertCustomSchemeToHttpUrl(urlHttp);
//         urlHttp = convertHttpUrlToCustomScheme(urlHttp);
//     }
//     const url_ = new URL(urlHttp);

//     // const r2_GOTO = url_.searchParams.get(URL_PARAM_GOTO);
//     // const r2_GOTO_DOM_RANGE = url_.searchParams.get(URL_PARAM_GOTO_DOM_RANGE);
//     // const r2_REFRESH = url_.searchParams.get(URL_PARAM_REFRESH);
//     const r2CSS = url_.searchParams.get(URL_PARAM_CSS);
//     const r2isMO = url_.searchParams.get(URL_PARAM_EPUBMEDIAOVERLAYS);
//     const r2ERS = url_.searchParams.get(URL_PARAM_EPUBREADINGSYSTEM);
//     const r2DEBUG = url_.searchParams.get(URL_PARAM_DEBUG_VISUALS);
//     const r2A11YSUPPORTENABLED = url_.searchParams.get(URL_PARAM_A11Y_SUPPORT_ENABLED);
//     const r2CLIPBOARDINTERCEPT = url_.searchParams.get(URL_PARAM_CLIPBOARD_INTERCEPT);
//     const r2SESSIONINFO = url_.searchParams.get(URL_PARAM_SESSION_INFO);
//     const r2WEBVIEWSLOT = url_.searchParams.get(URL_PARAM_WEBVIEW_SLOT);
//     const r2SECONDWEBVIEW = url_.searchParams.get(URL_PARAM_SECOND_WEBVIEW);

//     url_.search = "";
//     url_.hash = "";
//     const urlStr = url_.toString();
//     // debug(urlStr);

//     const patchElementSrc = (el: Element) => {
//         const src = el.getAttribute("src");
//         if (!src || src[0] === "/" ||
//             /^https?:\/\//.test(src) || /^data:\/\//.test(src)) {
//             return;
//         }
//         let src_ = src;
//         if (src_.startsWith("./")) {
//             src_ = src_.substr(2);
//         }
//         src_ = `${urlStr}/../${src_}`;
//         const iframeUrl = new URL(src_);

//         if (r2A11YSUPPORTENABLED) {
//             iframeUrl.searchParams.append(URL_PARAM_A11Y_SUPPORT_ENABLED, r2A11YSUPPORTENABLED);
//         }
//         if (r2CLIPBOARDINTERCEPT) {
//             iframeUrl.searchParams.append(URL_PARAM_CLIPBOARD_INTERCEPT, r2CLIPBOARDINTERCEPT);
//         }
//         if (r2SESSIONINFO) {
//             iframeUrl.searchParams.append(URL_PARAM_SESSION_INFO, r2SESSIONINFO);
//         }
//         if (r2DEBUG) {
//             iframeUrl.searchParams.append(URL_PARAM_DEBUG_VISUALS, r2DEBUG);
//         }
//         if (r2ERS) {
//             iframeUrl.searchParams.append(URL_PARAM_EPUBREADINGSYSTEM, r2ERS);
//         }
//         if (r2CSS) {
//             iframeUrl.searchParams.append(URL_PARAM_CSS, r2CSS);
//         }
//         if (r2isMO) {
//             iframeUrl.searchParams.append(URL_PARAM_EPUBMEDIAOVERLAYS, r2isMO);
//         }
//         if (r2WEBVIEWSLOT) {
//             iframeUrl.searchParams.append(URL_PARAM_WEBVIEW_SLOT, r2WEBVIEWSLOT);
//         }
//         if (r2SECONDWEBVIEW) {
//             iframeUrl.searchParams.append(URL_PARAM_SECOND_WEBVIEW, r2SECONDWEBVIEW);
//         }

//         iframeUrl.searchParams.append(URL_PARAM_IS_IFRAME, "1");
//         // debug(iframeUrl.search);

//         src_ = iframeUrl.toString();
//         debug(`IFRAME SRC PATCH: ${src} ==> ${src_}`);
//         el.setAttribute("src", src_);
//     };
//     const processTree = (el: Element) => {
//         const elName = el.nodeName.toLowerCase();
//         if (elName === "iframe") {
//             patchElementSrc(el);
//         } else {
//             if (!el.childNodes) {
//                 return;
//             }
//             // tslint:disable-next-line: prefer-for-of
//             for (let i = 0; i < el.childNodes.length; i++) {
//                 const childNode = el.childNodes[i];
//                 if (childNode.nodeType === 1) { // Node.ELEMENT_NODE
//                     processTree(childNode as Element);
//                 }
//             }
//         }
//     };
//     processTree(documantFromXmlDom.body);

//     const serialized = serializeDOM(documantFromXmlDom);

//     const prefix = htmlStr.substr(0, iHtmlStart);

//     const iHtmlStart_ = serialized.indexOf("<html");
//     if (iHtmlStart_ < 0) {
//         return htmlStr;
//     }

//     const remaining = serialized.substr(iHtmlStart_);
//     const newStr = `${prefix}${remaining}`;
//     // debug(newStr);
//     return newStr;
// };

// const transformerHttpBase: TTransformFunction = (
//     publication: Publication,
//     link: Link,
//     url: string | undefined,
//     htmlStr: string,
//     sessionInfo: string | undefined,
// ): string => {
//     // super hacky! (guarantees that convertCustomSchemeToHttpUrl() is necessary,
//     // unlike this `url` function parameter which is always HTTP as it originates
//     // from the streamer/server)
//     if (!_customUrlProtocolSchemeHandlerWasCalled) {
//         return htmlStr;
//     }

//     if (!url) {
//         return htmlStr;
//     }

//     const iHead = htmlStr.indexOf("</head>");
//     if (iHead < 0) {
//         return htmlStr;
//     }

//     // debug(url);
//     let urlHttp = url;
//     if (urlHttp.startsWith(READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) {
//         urlHttp = convertCustomSchemeToHttpUrl(urlHttp);
//     }
//     const url_ = new URL(urlHttp);
//     url_.search = "";
//     url_.hash = "";
//     const urlStr = url_.toString();
//     // debug(urlStr);

//     const baseStr = `
// <base href="${urlStr}" />
// `;
//     let newStr = htmlStr.substr(0, iHead) + baseStr + htmlStr.substr(iHead);
//     // debug(newStr);
//     newStr = newStr.replace(/<(audio|video)/g, "<$1 data-r2-crossorigin=\"true\" crossorigin=\"anonymous\" ");

//     // ensure iframes are fed the original URL base
//     newStr = transformerHttpBaseIframes(
//         publication,
//         link,
//         url,
//         newStr,
//         sessionInfo);

//     return newStr;
// };

// // this workaround for registerStreamProtocol() woes works with any relative URL,
// // even script-generated dynamic ones.
// const INJECT_HTTP_BASE = true;

// export function initSessions() {

//     app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

//     // because registerStreamProtocol() breaks HTTP byte range partial requests
//     // (see streamProtocolHandler() above)
//     if (INJECT_HTTP_BASE) {
//         Transformers.instance().add(new TransformerHTML(transformerHttpBase));
//     } else {
//         Transformers.instance().add(new TransformerHTML(transformerAudioVideo));
//     }

//     // https://github.com/electron/electron/blob/v3.0.0/docs/api/breaking-changes.md#webframe
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     if ((protocol as any).registerStandardSchemes) {
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         (protocol as any).registerStandardSchemes([READIUM2_ELECTRON_HTTP_PROTOCOL], { secure: true });
//     } else {
//         // tslint:disable-next-line:max-line-length
//         // https://github.com/electron/electron/blob/v5.0.0/docs/api/breaking-changes.md#privileged-schemes-registration
//         protocol.registerSchemesAsPrivileged([{
//             privileges: {
//                 allowServiceWorkers: false,
//                 bypassCSP: false,
//                 corsEnabled: true,
//                 secure: true,
//                 standard: true,
//                 stream: true,
//                 supportFetchAPI: true,
//             },
//             scheme: READIUM2_ELECTRON_HTTP_PROTOCOL,
//         }]);
//     }

//     app.on("ready", async () => {
//         debug("app ready");

//         try {
//             await clearSessions();
//         } catch (err) {
//             debug(err);
//         }

//         // registered below (session.defaultSession.protocol === protocol)
//         // protocol.registerHttpProtocol(
//         //     READIUM2_ELECTRON_HTTP_PROTOCOL,
//         //     httpProtocolHandler,
//         //     (error: Error) => {
//         //         if (error) {
//         //             debug(error);
//         //         } else {
//         //             debug("registerHttpProtocol OKAY (protocol session)");
//         //         }
//         //     });
//         if (session.defaultSession) {
//             if (USE_STREAM_PROTOCOL_INSTEAD_OF_HTTP) {

//                 session.defaultSession.protocol.registerStreamProtocol(
//                     READIUM2_ELECTRON_HTTP_PROTOCOL,
//                     streamProtocolHandler);
//             } else {
//                 session.defaultSession.protocol.registerHttpProtocol(
//                     READIUM2_ELECTRON_HTTP_PROTOCOL,
//                     httpProtocolHandler);
//             }
//         }
//         const webViewSession = getWebViewSession();
//         if (webViewSession) {
//             if (USE_STREAM_PROTOCOL_INSTEAD_OF_HTTP) {

//                 webViewSession.protocol.registerStreamProtocol(
//                     READIUM2_ELECTRON_HTTP_PROTOCOL,
//                     streamProtocolHandler);
//             } else {
//                 webViewSession.protocol.registerHttpProtocol(
//                     READIUM2_ELECTRON_HTTP_PROTOCOL,
//                     httpProtocolHandler);
//             }

//             webViewSession.setPermissionRequestHandler((wc, permission, callback) => {
//                 debug("setPermissionRequestHandler webViewSession");
//                 debug(wc.getURL());
//                 debug(permission);
//                 callback(false);
//             });
//             webViewSession.setPermissionCheckHandler((wc, permission, origin) => {
//                 debug("setPermissionCheckHandler webViewSession");
//                 debug(wc?.getURL());
//                 debug(permission);
//                 debug(origin);
//                 return false;
//             });
//         }
//     });

//     // Application-level lifecycle!
//     // async function willQuitCallback(evt: Electron.Event) {
//     //     debug("app will quit");
//     //     evt.preventDefault();

//     //     app.removeListener("will-quit", willQuitCallback);

//     //     try {
//     //         await clearSessions();
//     //     } catch (err) {
//     //         debug(err);
//     //     }
//     //     debug("Cache and StorageData cleared, now quitting...");
//     //     app.quit();
//     // }

//     // app.on("will-quit", willQuitCallback);
// }

export async function clearSession(sess: Electron.Session, str: string): Promise<void> {

    const prom1 = sess.clearCache();

    const prom2 = sess.clearStorageData({
        origin: "*",
        quotas: [
            "temporary",
            // "syncable",
        ],
        storages: [
            // "cookies",
            // "filesystem",
            // "indexdb",
            // "localstorage", BLOCKS!?
            // "shadercache",
            // "websql",
            "serviceworkers",
            "cachestorage",
        ],
    });

    try {
        const results = await promiseAllSettled<void>([prom1, prom2]);
        for (const result of results) {
            debug(`SESSION CACHE + STORAGE DATA CLEARED - ${str} => ${result.status}`);
        }
    } catch (err) {
        debug(err);
    }

    return Promise.resolve();
}

export function getWebViewSession() {
    return session.fromPartition(R2_SESSION_WEBVIEW, { cache: true });
}

export async function clearWebviewSession(): Promise<void> {
    const sess = getWebViewSession();
    if (sess) {
        try {
            await clearSession(sess, "[" + R2_SESSION_WEBVIEW + "]");
        } catch (err) {
            debug(err);
        }
    }

    return Promise.resolve();
}

export async function clearDefaultSession(): Promise<void> {
    if (session.defaultSession) {
        try {
            await clearSession(session.defaultSession, "[default]");
        } catch (err) {
            debug(err);
        }
    }

    return Promise.resolve();
}

export async function clearSessions(): Promise<void> {
    try {
        await promiseAllSettled([clearDefaultSession(), clearWebviewSession()]);
    } catch (err) {
        debug(err);
    }

    return Promise.resolve();
}
