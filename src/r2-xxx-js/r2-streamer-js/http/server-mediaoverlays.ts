// // ==LICENSE-BEGIN==
// // Copyright 2017 European Digital Reading Lab. All rights reserved.
// // Licensed to the Readium Foundation under one or more contributor license agreements.
// // Use of this source code is governed by a BSD-style license
// // that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// // ==LICENSE-END==

// import * as crypto from "crypto";
// import * as css2json from "css2json";
// import debug_ from "debug";
// import * as express from "express";
// import * as jsonMarkup from "json-markup";
// import * as path from "path";

// import { TaJsonSerialize } from "@r2-lcp-js/serializable";
// import { Publication } from "@r2-shared-js/models/publication";
// import {
//     getAllMediaOverlays, getMediaOverlay, mediaOverlayURLParam, mediaOverlayURLPath,
// } from "@r2-shared-js/parser/epub";
// import { encodeURIComponent_RFC3986, isHTTP } from "@r2-utils-js/_utils/http/UrlUtils";
// import { sortObject, traverseJsonObjects } from "@r2-utils-js/_utils/JsonUtils";

// import { IRequestPayloadExtension, IRequestQueryParams, _pathBase64, _show } from "./request-ext";
// import { Server } from "./server";

// const debug = debug_("r2:streamer#http/server-mediaoverlays");

// export function serverMediaOverlays(server: Server, routerPathBase64: express.Router) {

//     // https://github.com/mafintosh/json-markup/blob/master/style.css
//     const jsonStyle = `
// .json-markup {
//     line-height: 17px;
//     font-size: 13px;
//     font-family: monospace;
//     white-space: pre;
// }
// .json-markup-key {
//     font-weight: bold;
// }
// .json-markup-bool {
//     color: firebrick;
// }
// .json-markup-string {
//     color: green;
// }
// .json-markup-null {
//     color: gray;
// }
// .json-markup-number {
//     color: blue;
// }
// `;

//     const routerMediaOverlays = express.Router({ strict: false });
//     // routerMediaOverlays.use(morgan("combined", { stream: { write: (msg: any) => debug(msg) } }));

//     routerMediaOverlays.get(["/", "/" + _show + "{/:" + mediaOverlayURLParam + "}"],
//         async (req: express.Request, res: express.Response) => {

//             const reqparams = (req as IRequestPayloadExtension).params;

//             if (!reqparams.pathBase64) {
//                 reqparams.pathBase64 = (req as IRequestPayloadExtension).pathBase64;
//             }
//             if (!reqparams.lcpPass64) {
//                 reqparams.lcpPass64 = (req as IRequestPayloadExtension).lcpPass64;
//             }

//             const isShow = req.url.indexOf("/show") >= 0 || (req.query as IRequestQueryParams).show;

//             // debug(req.method);
//             const isHead = req.method.toLowerCase() === "head";
//             if (isHead) {
//                 debug("HEAD !!!!!!!!!!!!!!!!!!!");
//             }

//             const isCanonical = (req.query as IRequestQueryParams).canonical &&
//                 (req.query as IRequestQueryParams).canonical === "true";

//             const isSecureHttp = req.secure ||
//                 req.protocol === "https" ||
//                 req.get("X-Forwarded-Proto") === "https"
//                 ;

//             // reqparams.pathBase64 is already decoded!
//             // const decoded = decodeURIComponent(reqparams.pathBase64);
//             const pathBase64Str = Buffer.from(reqparams.pathBase64, "base64").toString("utf8");

//             // const fileName = path.basename(pathBase64Str);
//             // const ext = path.extname(fileName);

//             let publication: Publication;
//             try {
//                 publication = await server.loadOrGetCachedPublication(pathBase64Str);
//             } catch (err) {
//                 debug(err);
//                 res.status(500).send("<html><body><p>Internal Server Error</p><p>"
//                     + err + "</p></body></html>");
//                 return;
//             }

//             // dumpPublication(publication);

//             const rootUrl = (isSecureHttp ? "https://" : "http://")
//                 + req.headers.host + "/pub/"
//                 + (reqparams.lcpPass64 ?
//                     (server.lcpBeginToken + encodeURIComponent_RFC3986(reqparams.lcpPass64) + server.lcpEndToken) :
//                     "")
//                 + encodeURIComponent_RFC3986(reqparams.pathBase64);

//             function absoluteURL(href: string): string {
//                 return rootUrl + "/" + href;
//             }

//             // eslint-disable-next-line @typescript-eslint/no-explicit-any
//             function absolutizeURLs(jsonObject: any) {
//                 traverseJsonObjects(jsonObject,
//                     (obj) => {
//                         if (obj.text && typeof obj.text === "string"
//                             && !isHTTP(obj.text)) {
//                             // obj.text_ = obj.text;
//                             obj.text = absoluteURL(obj.text);
//                         }

//                         if (obj.audio && typeof obj.audio === "string"
//                             && !isHTTP(obj.audio)) {
//                             // obj.audio_ = obj.audio;
//                             obj.audio = absoluteURL(obj.audio);
//                         }
//                     });
//             }

//             // eslint-disable-next-line @typescript-eslint/no-explicit-any
//             let objToSerialize: any = null;

//             const resource = isShow ?
//                 ((req.query as IRequestQueryParams).show ?
//                     (req.query as IRequestQueryParams).show :
//                     reqparams[mediaOverlayURLParam]) :
//                         (req.query as IRequestQueryParams)[mediaOverlayURLParam];
//             if (resource && resource !== "all") {
//                 try {
//                     objToSerialize = await getMediaOverlay(publication, resource);
//                 } catch (err) {
//                     debug(err);
//                     res.status(500).send("<html><body><p>Internal Server Error</p><p>"
//                         + err + "</p></body></html>");
//                     return;
//                 }
//             } else {
//                 try {
//                     objToSerialize = await getAllMediaOverlays(publication);
//                 } catch (err) {
//                     debug(err);
//                     res.status(500).send("<html><body><p>Internal Server Error</p><p>"
//                         + err + "</p></body></html>");
//                     return;
//                 }
//             }

//             if (!objToSerialize) {
//                 objToSerialize = [];
//             }

//             const jsonObj = TaJsonSerialize(objToSerialize);
//             // jsonObj = { "media-overlay": jsonObj };

//             if (isShow) {
//                 absolutizeURLs(jsonObj);

//                 // const jsonStr = global.JSON.stringify(jsonObj, null, "    ");

//                 // // breakLength: 100  maxArrayLength: undefined
//                 // const dumpStr = util.inspect(objToSerialize,
//                 //     { showHidden: false, depth: 1000, colors: false, customInspect: true });

//                 const jsonPretty = jsonMarkup(jsonObj, css2json(jsonStyle));

//                 res.status(200).send("<html><body>" +
//                     "<h1>" + path.basename(pathBase64Str) + "</h1>" +
//                     "<p><pre>" + jsonPretty + "</pre></p>" +
//                     // "<p><pre>" + jsonStr + "</pre></p>" +
//                     // "<p><pre>" + dumpStr + "</pre></p>" +
//                     "</body></html>");
//             } else {
//                 // absolutizeURLs(jsonObj);

//                 server.setResponseCORS(res);
//                 res.set("Content-Type", "application/vnd.syncnarr+json; charset=utf-8");

//                 const jsonStr = isCanonical ?
//                     global.JSON.stringify(sortObject(jsonObj), null, "") :
//                     global.JSON.stringify(jsonObj, null, "  ");

//                 const checkSum = crypto.createHash("sha256");
//                 checkSum.update(jsonStr);
//                 const hash = checkSum.digest("hex");

//                 const match = req.header("If-None-Match");
//                 if (match === hash) {
//                     debug("smil cache");
//                     res.status(304); // StatusNotModified
//                     res.end();
//                     return;
//                 }

//                 res.setHeader("ETag", hash);
//                 // server.setResponseCacheHeaders(res, true);

//                 res.status(200);

//                 if (isHead) {
//                     res.end();
//                 } else {
//                     res.send(jsonStr);
//                 }
//             }
//         });

//     routerPathBase64.use("/:" + _pathBase64 + "/" + mediaOverlayURLPath, routerMediaOverlays);
// }
