// // ==LICENSE-BEGIN==
// // Copyright 2017 European Digital Reading Lab. All rights reserved.
// // Licensed to the Readium Foundation under one or more contributor license agreements.
// // Use of this source code is governed by a BSD-style license
// // that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// // ==LICENSE-END==

// import * as crypto from "crypto";
// import * as css2json from "css2json";
// import debug_ from "debug";
// import * as DotProp from "dot-prop";
// import * as express from "express";
// import * as jsonMarkup from "json-markup";
// import * as path from "path";

// import { JsonArray, TaJsonSerialize } from "@r2-lcp-js/serializable";
// import { Publication } from "@r2-shared-js/models/publication";
// import { Link } from "@r2-shared-js/models/publication-link";
// import {
//     getAllMediaOverlays, mediaOverlayURLParam, mediaOverlayURLPath,
// } from "@r2-shared-js/parser/epub";
// import { encodeURIComponent_RFC3986, isHTTP } from "@r2-utils-js/_utils/http/UrlUtils";
// import { sortObject, traverseJsonObjects } from "@r2-utils-js/_utils/JsonUtils";

// import { jsonSchemaValidate } from "../utils/json-schema-validate";
// import {
//     IRequestPayloadExtension, IRequestQueryParams, _jsonPath, _pathBase64, _show,
// } from "./request-ext";
// import { Server } from "./server";
// import { signExpiringResourceURLs } from "./url-signed-expiry";

// const debug = debug_("r2:streamer#http/server-manifestjson");

// export function serverManifestJson(server: Server, routerPathBase64: express.Router) {

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

//     const routerManifestJson = express.Router({ strict: false });
//     // routerManifestJson.use(morgan("combined", { stream: { write: (msg: any) => debug(msg) } }));

//     routerManifestJson.get(["/", "/" + _show + "{/:" + _jsonPath + "}"],
//         async (req: express.Request, res: express.Response) => {

//             const reqparams = (req as IRequestPayloadExtension).params;

//             if (!reqparams.pathBase64) {
//                 reqparams.pathBase64 = (req as IRequestPayloadExtension).pathBase64;
//             }
//             if (!reqparams.lcpPass64) {
//                 reqparams.lcpPass64 = (req as IRequestPayloadExtension).lcpPass64;
//             }

//             const isShow = req.url.indexOf("/show") >= 0 || (req.query as IRequestQueryParams).show;
//             if (!reqparams.jsonPath && (req.query as IRequestQueryParams).show) {
//                 reqparams.jsonPath = (req.query as IRequestQueryParams).show;
//             }

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

//             if (reqparams.lcpPass64 && !server.disableDecryption) {
//                 // reqparams.lcpPass64 is already decoded!
//                 // const decoded = decodeURIComponent(reqparams.lcpPass64);
//                 const lcpPass = Buffer.from(reqparams.lcpPass64, "base64").toString("utf8");
//                 if (publication.LCP) {
//                     try {
//                         await publication.LCP.tryUserKeys([lcpPass]); // hex
//                     } catch (err) {
//                         // a bit brutal, but that's just for testing anyway (not real-world usage pattern)
//                         publication.LCP.ContentKey = undefined;
//                         debug(err);
//                         const errMsg = "FAIL publication.LCP.tryUserKeys(): " + err;
//                         debug(errMsg);
//                         res.status(500).send("<html><body><p>Internal Server Error</p><p>"
//                             + errMsg + "</p></body></html>");
//                         return;
//                     }
//                 }
//             }

//             // debug(req.url); // path local to this router
//             // debug(req.baseUrl); // path local to above this router
//             // debug(req.originalUrl); // full path (req.baseUrl + req.url)
//             // url.parse(req.originalUrl, false).host
//             // req.headers.host has port, not req.hostname

//             const rootUrl = (isSecureHttp ? "https://" : "http://")
//                 + req.headers.host + "/pub/"
//                 + (reqparams.lcpPass64 ?
//                     (server.lcpBeginToken + encodeURIComponent_RFC3986(reqparams.lcpPass64) + server.lcpEndToken) :
//                     "")
//                 + encodeURIComponent_RFC3986(reqparams.pathBase64);
//             const manifestURL = rootUrl + "/" + "manifest.json";

//             const contentType =
//                 (publication.Metadata && publication.Metadata.RDFType &&
//                 /https?:\/\/schema\.org\/Audiobook$/.test(publication.Metadata.RDFType)) ?
//                 "application/audiobook+json" : ((publication.Metadata && publication.Metadata.RDFType &&
//                     (/https?:\/\/schema\.org\/ComicStory$/.test(publication.Metadata.RDFType) ||
//                     /https?:\/\/schema\.org\/VisualNarrative$/.test(publication.Metadata.RDFType))) ? "application/divina+json" :
//                         "application/webpub+json");

//             const selfLink = publication.searchLinkByRel("self");
//             if (!selfLink) {
//                 publication.AddLink(contentType, ["self"], manifestURL, undefined);
//             }

//             // // test JSON Schema string format "uri-template" vs. "uri-reference"
//             // publication.AddLink("txt", ["test1"], "./relative/%20URL?param=val#hash", false);
//             // publication.AddLink("txt", ["test2"], "./relative/%20URL?param=val#hash", true);
//             // publication.AddLink("txt", ["test3"], "./relative/%20URL?param=val#hash", undefined);

//             // publication.AddLink("txt", ["test4"], "./relative/%20URL{var}/?param=val#hash", false);
//             // publication.AddLink("txt", ["test5"], "./relative/%20URL{var}/?param=val#hash", true);
//             // publication.AddLink("txt", ["test6"], "./relative/%20URL{var}/?param=val#hash", undefined);

//             // publication.AddLink("txt", ["test7"], "http://absolute.com/%20URL?param=val#hash", false);
//             // publication.AddLink("txt", ["test8"], "http://absolute.com/%20URL?param=val#hash", true);
//             // publication.AddLink("txt", ["test9"], "http://absolute.com/%20URL?param=val#hash", undefined);

//             // publication.AddLink("txt", ["test10"], "http://absolute.com/%20URL{var}/?param=val#hash", false);
//             // publication.AddLink("txt", ["test11"], "http://absolute.com/%20URL{var}/?param=val#hash", true);
//             // publication.AddLink("txt", ["test12"], "http://absolute.com/%20URL{var}/?param=val#hash", undefined);

//             function absoluteURL(href: string): string {
//                 return rootUrl + "/" + href;
//             }

//             // eslint-disable-next-line @typescript-eslint/no-explicit-any
//             function absolutizeURLs(jsonObj: any) {
//                 traverseJsonObjects(jsonObj,
//                     (obj) => {
//                         if (obj.href && typeof obj.href === "string"
//                             && !isHTTP(obj.href)) {
//                             // obj.href_ = obj.href;
//                             obj.href = absoluteURL(obj.href);
//                         }

//                         if (obj["media-overlay"] && typeof obj["media-overlay"] === "string"
//                             && !isHTTP(obj["media-overlay"])) {
//                             // obj["media-overlay_"] = obj["media-overlay"];
//                             obj["media-overlay"] = absoluteURL(obj["media-overlay"]);
//                         }
//                     });
//             }

//             let hasMO = false;
//             if (publication.Spine) {
//                 const link = publication.Spine.find((l) => {
//                     if (l.Properties && l.Properties.MediaOverlay) {
//                         return true;
//                     }
//                     return false;
//                 });
//                 if (link) {
//                     hasMO = true;
//                 }
//             }
//             if (hasMO) {
//                 const moLink = publication.searchLinkByRel("media-overlay");
//                 if (!moLink) {
//                     const moURL = // rootUrl + "/" +
//                         mediaOverlayURLPath +
//                         "?" + mediaOverlayURLParam + "={path}";
//                     publication.AddLink("application/vnd.syncnarr+json", ["media-overlay"], moURL, true);
//                 }
//             }

//             if (isShow) {
//                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
//                 let objToSerialize: any = null;

//                 if (reqparams.jsonPath) {
//                     switch (reqparams.jsonPath) {

//                         case "all": {
//                             objToSerialize = publication;
//                             break;
//                         }
//                         case "cover": {
//                             objToSerialize = publication.GetCover();
//                             break;
//                         }
//                         case "mediaoverlays": {
//                             try {
//                                 objToSerialize = await getAllMediaOverlays(publication);
//                             } catch (err) {
//                                 debug(err);
//                                 res.status(500).send("<html><body><p>Internal Server Error</p><p>"
//                                     + err + "</p></body></html>");
//                                 return;
//                             }
//                             break;
//                         }
//                         case "spine": {
//                             objToSerialize = publication.Spine;
//                             break;
//                         }
//                         case "pagelist": {
//                             objToSerialize = publication.PageList;
//                             break;
//                         }
//                         case "landmarks": {
//                             objToSerialize = publication.Landmarks;
//                             break;
//                         }
//                         case "links": {
//                             objToSerialize = publication.Links;
//                             break;
//                         }
//                         case "resources": {
//                             objToSerialize = publication.Resources;
//                             break;
//                         }
//                         case "toc": {
//                             objToSerialize = publication.TOC;
//                             break;
//                         }
//                         case "metadata": {
//                             objToSerialize = publication.Metadata;
//                             break;
//                         }
//                         default: {
//                             objToSerialize = null;
//                         }
//                     }
//                 } else {
//                     objToSerialize = publication;
//                 }

//                 if (!objToSerialize) {
//                     objToSerialize = {};
//                 }

//                 const jsonObj = TaJsonSerialize(objToSerialize);

//                 if (server.enableSignedExpiry) {
//                     signExpiringResourceURLs(rootUrl, pathBase64Str, jsonObj);
//                 }

//                 let validationStr: string | undefined;
//                 const doValidate = !reqparams.jsonPath || reqparams.jsonPath === "all";
//                 if (doValidate) {

//                     const jsonSchemasRootpath = path.join(process.cwd(), "misc", "json-schema");
//                     const jsonSchemasNames = [
//                         "webpub-manifest/publication", // must be first!
//                         "webpub-manifest/contributor-object",
//                         "webpub-manifest/contributor",
//                         "webpub-manifest/link",
//                         "webpub-manifest/a11y",
//                         "webpub-manifest/metadata",
//                         "webpub-manifest/subcollection",
//                         // "webpub-manifest/properties",
//                         "webpub-manifest/subject",
//                         "webpub-manifest/subject-object",
//                         "webpub-manifest/extensions/epub/metadata",
//                         "webpub-manifest/extensions/epub/subcollections",
//                         "webpub-manifest/extensions/epub/properties",
//                         "webpub-manifest/extensions/presentation/metadata",
//                         "webpub-manifest/extensions/presentation/properties",
//                         "webpub-manifest/language-map",
//                         // "opds/feed",
//                         // "opds/publication",
//                         "opds/acquisition-object",
//                         "opds/catalog-entry",
//                         // "opds/feed-metadata",
//                         "opds/properties",
//                         // "opds/authentication",
//                         // "lcp/lcpdf",
//                         // "lcp/license",
//                         // "lcp/link",
//                         // "lcp/status",
//                     ];

//                     const validationErrors =
//                         jsonSchemaValidate(jsonSchemasRootpath, jsonSchemasNames, jsonObj);
//                     if (validationErrors) {
//                         validationStr = "";

//                         for (const err of validationErrors) {

//                             debug("JSON Schema validation FAIL.");
//                             debug(err);

//                             const val = err.jsonPath ? DotProp.get(jsonObj, err.jsonPath) : "";
//                             const valueStr = (typeof val === "string") ?
//                                 `${val}` :
//                                 ((val instanceof Array || typeof val === "object") ?
//                                 `${JSON.stringify(val)}` :
//                                     "");
//                             debug(valueStr);

//                             const title = DotProp.get(jsonObj, "metadata.title");
//                             debug(JSON.stringify(title));

//                             validationStr +=
//                             // tslint:disable-next-line:max-line-length
//                             `\n"${JSON.stringify(title)}"\n\n${err.ajvMessage}: ${valueStr}\n\n'${err.ajvDataPath?.replace(/^\./, "")}' (${err.ajvSchemaPath})\n\n`;
//                         }
//                     }
//                 }

//                 absolutizeURLs(jsonObj);

//                 // const jsonStr = global.JSON.stringify(jsonObj, null, "    ");

//                 // // breakLength: 100  maxArrayLength: undefined
//                 // const dumpStr = util.inspect(objToSerialize,
//                 //     { showHidden: false, depth: 1000, colors: false, customInspect: true });

//                 let jsonPretty = jsonMarkup(jsonObj, css2json(jsonStyle));

//                 const regex = new RegExp(">" + rootUrl + "/([^<]+</a>)", "g");
//                 jsonPretty = jsonPretty.replace(regex, ">$1");
//                 jsonPretty = jsonPretty.replace(/>manifest.json<\/a>/, ">" + rootUrl + "/manifest.json</a>");

//                 let coverImage: string | undefined;
//                 // const coverLink = publication.GetCover();
//                 // if (coverLink) {
//                 //     coverImage = coverLink.Href;
//                 //     // if (coverImage && !isHTTP(coverImage)) {
//                 //     //     coverImage = absoluteURL(coverImage);
//                 //     // }
//                 // }
//                 const findCover = (arr: JsonArray): string | undefined => {
//                     let coverHref: string | undefined;
//                     for (const link of arr) {
//                         if (link && typeof link === "object" && !Array.isArray(link) && link.rel === "cover" && link.href && typeof link.href === "string") {
//                             coverHref = link.href;
//                             break;
//                         }
//                     }
//                     return coverHref;
//                 };
//                 if (jsonObj.resources && Array.isArray(jsonObj.resources)) {
//                     coverImage = findCover(jsonObj.resources);
//                 }
//                 if (!coverImage) {
//                     if (jsonObj.links && Array.isArray(jsonObj.links)) {
//                         coverImage = findCover(jsonObj.links);
//                     }
//                 }
//                 if (!coverImage) {
//                     if (jsonObj.readingOrder && Array.isArray(jsonObj.readingOrder)) {
//                         coverImage = findCover(jsonObj.readingOrder);
//                     }
//                 }
//                 res.status(200).send("<html>" +
//                     "<head><script type=\"application/ld+json\" href=\"" +
//                     manifestURL +
//                     "\"></script></head>" +
//                     "<body>" +
//                     "<h1>" + path.basename(pathBase64Str) + "</h1>" +
//                     // tslint:disable-next-line:max-line-length
//                     (coverImage ? "<a href=\"" + coverImage + "\"><div style=\"width: 400px;\"><img src=\"" + coverImage + "\" alt=\"\" style=\"display: block; width: 100%; height: auto;\"/></div></a>" : "") +
//                     "<hr><p><pre>" + jsonPretty + "</pre></p>" +
//                     // tslint:disable-next-line:max-line-length
//                     (doValidate ? (validationStr ? ("<hr><p><pre>" + validationStr + "</pre></p>") : ("<hr><p>JSON SCHEMA OK.</p>")) : "") +
//                     // "<hr><p><pre>" + jsonStr + "</pre></p>" +
//                     // "<p><pre>" + dumpStr + "</pre></p>" +
//                     "</body></html>");
//             } else {
//                 server.setResponseCORS(res);
//                 res.set("Content-Type", `${contentType}; charset=utf-8`);

//                 const publicationJsonObj = TaJsonSerialize(publication);

//                 if (server.enableSignedExpiry) {
//                     signExpiringResourceURLs(rootUrl, pathBase64Str, publicationJsonObj);
//                 }

//                 // absolutizeURLs(publicationJsonObj);

//                 if (isCanonical) {
//                     if (publicationJsonObj.links) {
//                         delete publicationJsonObj.links;
//                     }
//                 }

//                 const publicationJsonStr = isCanonical ?
//                     global.JSON.stringify(sortObject(publicationJsonObj), null, "") :
//                     global.JSON.stringify(publicationJsonObj, null, "  ");

//                 const checkSum = crypto.createHash("sha256");
//                 checkSum.update(publicationJsonStr);
//                 const hash = checkSum.digest("hex");

//                 const match = req.header("If-None-Match");
//                 if (match === hash) {
//                     debug("manifest.json cache");
//                     res.status(304); // StatusNotModified
//                     res.end();
//                     return;
//                 }

//                 res.setHeader("ETag", hash);
//                 // server.setResponseCacheHeaders(res, true);

//                 const links = getPreFetchResources(publication);
//                 if (links && links.length) {
//                     let n = 0;
//                     let prefetch = "";
//                     for (const l of links) {
//                         n++;
//                         if (n > server.maxPrefetchLinks) {
//                             break;
//                         }
//                         const href = absoluteURL(l.Href);
//                         prefetch += "<" + href + ">;" + "rel=prefetch,";
//                     }
//                     res.setHeader("Link", prefetch);
//                 }

//                 res.status(200);

//                 if (isHead) {
//                     res.end();
//                 } else {
//                     res.send(publicationJsonStr);
//                 }
//             }
//         });

//     routerPathBase64.use("/:" + _pathBase64 + "/manifest.json", routerManifestJson);
// }

// function getPreFetchResources(publication: Publication): Link[] {
//     const links: Link[] = [];

//     if (publication.Resources) {
//         // https://w3c.github.io/publ-epub-revision/epub32/spec/epub-spec.html#cmt-grp-font
//         const mediaTypes = ["text/css",
//             "text/javascript", "application/javascript",
//             "application/vnd.ms-opentype", "font/otf", "application/font-sfnt",
//             "font/ttf", "application/font-sfnt",
//             "font/woff", "application/font-woff", "font/woff2"];
//         for (const mediaType of mediaTypes) {
//             for (const link of publication.Resources) {
//                 if (link.TypeLink === mediaType) {
//                     links.push(link);
//                 }
//             }
//         }
//     }

//     return links;
// }
