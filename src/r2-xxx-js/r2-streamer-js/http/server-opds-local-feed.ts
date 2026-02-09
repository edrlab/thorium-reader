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
// import { OPDSLink } from "@r2-opds-js/opds/opds2/opds2-link";
// import { isHTTP } from "@r2-utils-js/_utils/http/UrlUtils";
// import { sortObject, traverseJsonObjects } from "@r2-utils-js/_utils/JsonUtils";

// import { jsonSchemaValidate } from "../utils/json-schema-validate";
// import { IRequestPayloadExtension, IRequestQueryParams, _jsonPath, _show } from "./request-ext";
// import { Server } from "./server";
// import { trailingSlashRedirect } from "./server-trailing-slash-redirect";

// const debug = debug_("r2:streamer#http/server-opds-local-feed");

// // tslint:disable-next-line:variable-name
// export const serverOPDS_local_feed_PATH = "/opds2";
// // tslint:disable-next-line:variable-name
// export const serverOPDS_local_feed_PATH_ = "/publications.json";
// export function serverOPDS_local_feed(server: Server, topRouter: express.Application) {

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

//     // tslint:disable-next-line:variable-name
//     const routerOPDS_local_feed = express.Router({ strict: false });
//     // routerOPDS2.use(morgan("combined", { stream: { write: (msg: any) => debug(msg) } }));

//     routerOPDS_local_feed.get(["/", "/" + _show + "{/:" + _jsonPath + "}"],
//         (req: express.Request, res: express.Response) => {

//             const reqparams = (req as IRequestPayloadExtension).params;

//             const isShow = req.url.indexOf("/show") >= 0 || (req.query as IRequestQueryParams).show;
//             if (!reqparams.jsonPath && (req.query as IRequestQueryParams).show) {
//                 reqparams.jsonPath = (req.query as IRequestQueryParams).show;
//             }

//             const isCanonical = (req.query as IRequestQueryParams).canonical &&
//                 (req.query as IRequestQueryParams).canonical === "true";

//             const isSecureHttp = req.secure ||
//                 req.protocol === "https" ||
//                 req.get("X-Forwarded-Proto") === "https"
//                 ;

//             const rootUrl = (isSecureHttp ? "https://" : "http://")
//                 + req.headers.host;
//             const selfURL = rootUrl + serverOPDS_local_feed_PATH + serverOPDS_local_feed_PATH_;

//             const feed = server.publicationsOPDS();
//             if (!feed) {
//                 const err = "Publications OPDS2 feed not available yet, try again later.";
//                 debug(err);
//                 res.status(503).send("<html><body><p>Resource temporarily unavailable</p><p>"
//                     + err + "</p></body></html>");
//                 return;
//             }

//             if (!feed.findFirstLinkByRel("self")) {
//                 feed.Links = [];
//                 const selfLink = new OPDSLink();
//                 selfLink.Href = selfURL;
//                 selfLink.TypeLink = "application/opds+json";
//                 selfLink.AddRel("self");
//                 feed.Links.push(selfLink);
//             }

//             function absoluteURL(href: string): string {
//                 return rootUrl + "/pub/" + href;
//             }

//             // eslint-disable-next-line @typescript-eslint/no-explicit-any
//             function absolutizeURLs(jsonObj: any) {
//                 traverseJsonObjects(jsonObj,
//                     (obj) => {
//                         if (obj.href && typeof obj.href === "string") {

//                             if (!isHTTP(obj.href)) {
//                                 // obj.href_ = obj.href;
//                                 obj.href = absoluteURL(obj.href);
//                             }

//                             if (isShow &&
//                                 (obj.type === "application/webpub+json"
//                                     || obj.type === "application/audiobook+json"
//                                     || obj.type === "application/divina+json") &&
//                                 obj.rel === "http://opds-spec.org/acquisition" &&
//                                 (obj.href as string).endsWith("/manifest.json")) {
//                                     obj.href += "/show";
//                             }
//                         }
//                     });
//             }

//             if (isShow) {
//                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
//                 let objToSerialize: any = null;

//                 if (reqparams.jsonPath) {
//                     switch (reqparams.jsonPath) {

//                         case "all": {
//                             objToSerialize = feed;
//                             break;
//                         }
//                         case "metadata": {
//                             objToSerialize = feed.Metadata;
//                             break;
//                         }
//                         case "links": {
//                             objToSerialize = feed.Links;
//                             break;
//                         }
//                         case "publications": {
//                             objToSerialize = feed.Publications;
//                             break;
//                         }
//                         default: {
//                             objToSerialize = null;
//                         }
//                     }
//                 } else {
//                     objToSerialize = feed;
//                 }

//                 if (!objToSerialize) {
//                     objToSerialize = {};
//                 }

//                 const jsonObj = TaJsonSerialize(objToSerialize);

//                 let validationStr: string | undefined;
//                 const doValidate = !reqparams.jsonPath || reqparams.jsonPath === "all";
//                 if (doValidate) {

//                     const jsonSchemasRootpath = path.join(process.cwd(), "misc", "json-schema");
//                     const jsonSchemasNames = [
//                         "opds/feed", // must be first!
//                         "opds/publication",
//                         "opds/acquisition-object",
//                         "opds/catalog-entry",
//                         "opds/feed-metadata",
//                         "opds/properties",
//                         // "opds/authentication",
//                         "webpub-manifest/publication",
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

//                             let title = "";
//                             let pubIndex = "";
//                             if (err.jsonPath && /^publications\.[0-9]+/.test(err.jsonPath)) {
//                                 const jsonPubTitlePath =
//                                     err.jsonPath.replace(/^(publications\.[0-9]+).*/, "$1.metadata.title");
//                                 debug(jsonPubTitlePath);
//                                 title = DotProp.get(jsonObj, jsonPubTitlePath);
//                                 debug(title);

//                                 pubIndex = err.jsonPath.replace(/^publications\.([0-9]+).*/, "$1");
//                                 debug(pubIndex);
//                             }

//                             validationStr +=
//                             // tslint:disable-next-line:max-line-length
//                             `\n___________INDEX___________ #${pubIndex} "${title}"\n\n${err.ajvMessage}: ${valueStr}\n\n'${err.ajvDataPath?.replace(/^\./, "")}' (${err.ajvSchemaPath})\n\n`;
//                         }
//                     }
//                 }

//                 absolutizeURLs(jsonObj);

//                 if (jsonObj.publications && (jsonObj.publications as JsonArray).length) {
//                     let i = 0;
//                     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//                     (jsonObj.publications as JsonArray).forEach((pub: any) => {
//                         pub.___________INDEX___________ = i++;
//                     });
//                 }

//                 // const jsonStr = global.JSON.stringify(jsonObj, null, "    ");

//                 // // breakLength: 100  maxArrayLength: undefined
//                 // const dumpStr = util.inspect(objToSerialize,
//                 //     { showHidden: false, depth: 1000, colors: false, customInspect: true });

//                 const jsonPretty = jsonMarkup(jsonObj, css2json(jsonStyle));

//                 // const regex = new RegExp(">" + rootUrl + "/([^<]+</a>)", "g");
//                 // jsonPretty = jsonPretty.replace(regex, ">$1");
//                 // jsonPretty = jsonPretty.replace(/>publications.json<\/a>/, ">" + rootUrl + "/publications.json</a>");

//                 res.status(200).send("<html><body>" +
//                     "<h1>OPDS2 JSON feed</h1>" +
//                     "<hr><p><pre>" + jsonPretty + "</pre></p>" +
//                     // tslint:disable-next-line:max-line-length
//                     (doValidate ? (validationStr ? ("<hr><p><pre>" + validationStr + "</pre></p>") : ("<hr><p>JSON SCHEMA OK.</p>")) : "") +
//                     // "<hr><p><pre>" + jsonStr + "</pre></p>" +
//                     // "<p><pre>" + dumpStr + "</pre></p>" +
//                     "</body></html>");
//             } else {
//                 server.setResponseCORS(res);
//                 res.set("Content-Type", "application/opds+json; charset=utf-8");

//                 const publicationsJsonObj = TaJsonSerialize(feed);

//                 absolutizeURLs(publicationsJsonObj);

//                 const publicationsJsonStr = isCanonical ?
//                     global.JSON.stringify(sortObject(publicationsJsonObj), null, "") :
//                     global.JSON.stringify(publicationsJsonObj, null, "  ");

//                 const checkSum = crypto.createHash("sha256");
//                 checkSum.update(publicationsJsonStr);
//                 const hash = checkSum.digest("hex");

//                 const match = req.header("If-None-Match");
//                 if (match === hash) {
//                     debug("opds2 publications.json cache");
//                     res.status(304); // StatusNotModified
//                     res.end();
//                     return;
//                 }

//                 res.setHeader("ETag", hash);
//                 // server.setResponseCacheHeaders(res, true);

//                 res.status(200).send(publicationsJsonStr);
//             }
//         });

//     // tslint:disable-next-line:variable-name
//     const routerOPDS_local_feed_ = express.Router({ strict: false });
//     // routerOPDS2_.use(morgan("combined", { stream: { write: (msg: any) => debug(msg) } }));

//     routerOPDS_local_feed_.use(trailingSlashRedirect);

//     routerOPDS_local_feed_.get("/", (req: express.Request, res: express.Response) => {

//         const i = req.originalUrl.indexOf("?");

//         let pathWithoutQuery = req.originalUrl;
//         if (i >= 0) {
//             pathWithoutQuery = pathWithoutQuery.substr(0, i);
//         }

//         let redirect = pathWithoutQuery +
//             // (pathWithoutQuery.substr(-1) === "/" ? "" : "/") +
//             serverOPDS_local_feed_PATH_ + "/show";
//         redirect = redirect.replace("//", "/");
//         if (i >= 0) {
//             redirect += req.originalUrl.substr(i);
//         }

//         // No need for CORS with "show" URL redirect
//         // server.setResponseCORS(res);

//         debug(`REDIRECT: ${req.originalUrl} ==> ${redirect}`);
//         res.redirect(301, redirect);
//     });

//     routerOPDS_local_feed_.use(serverOPDS_local_feed_PATH_, routerOPDS_local_feed);

//     topRouter.use(serverOPDS_local_feed_PATH, routerOPDS_local_feed_);
// }
