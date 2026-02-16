// // ==LICENSE-BEGIN==
// // Copyright 2017 European Digital Reading Lab. All rights reserved.
// // Licensed to the Readium Foundation under one or more contributor license agreements.
// // Use of this source code is governed by a BSD-style license
// // that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// // ==LICENSE-END==

// // import * as regexpEscape from "regexp.escape";

// import debug_ from "debug";
// import * as express from "express";
// import * as morgan from "morgan";
// import * as request from "request";
// // import * as requestPromise from "request-promise-native";
// import * as xmldom from "@xmldom/xmldom";

// import { OPDS } from "@r2-opds-js/opds/opds1/opds";
// import { Entry } from "@r2-opds-js/opds/opds1/opds-entry";
// import { encodeURIComponent_RFC3986, ensureAbsolute } from "@r2-utils-js/_utils/http/UrlUtils";
// import { streamToBufferPromise } from "@r2-utils-js/_utils/stream/BufferUtils";
// import { XML } from "@r2-utils-js/_utils/xml-js-mapper";
// import { removeUTF8BOM } from "@r2-utils-js/_utils/bom";

// import { IRequestPayloadExtension, _urlEncoded } from "./request-ext";
// import { Server } from "./server";
// import { serverLCPLSD_show_PATH } from "./server-lcp-lsd-show";
// import { trailingSlashRedirect } from "./server-trailing-slash-redirect";
// import { serverRemotePub_PATH } from "./server-url";

// const debug = debug_("r2:streamer#http/server-opds-browse-v1");

// // tslint:disable-next-line:variable-name
// export const serverOPDS_browse_v1_PATH = "/opds-v1-browse";
// export function serverOPDS_browse_v1(_server: Server, topRouter: express.Application) {

//     // tslint:disable-next-line:variable-name
//     const routerOPDS_browse_v1 = express.Router({ strict: false });
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     routerOPDS_browse_v1.use(morgan("combined", { stream: { write: (msg: any) => debug(msg) } }));

//     routerOPDS_browse_v1.use(trailingSlashRedirect);

//     routerOPDS_browse_v1.get("/", (_req: express.Request, res: express.Response) => {

//         let html = "<html><head>";
//         html += "<script type=\"text/javascript\">function encodeURIComponent_RFC3986(str) { " +
//             "return encodeURIComponent(str).replace(/[!'()*]/g, (c) => { " +
//             "return \"%\" + c.charCodeAt(0).toString(16); }); }" +
//             "function go(evt) {" +
//             "if (evt) { evt.preventDefault(); } var url = " +
//             "location.origin +" +
//             // `location.protocol + '//' + location.hostname + ` +
//             // `(location.port ? (':' + location.port) : '') + ` +
//             ` '${serverOPDS_browse_v1_PATH}/' +` +
//             " encodeURIComponent_RFC3986(document.getElementById(\"url\").value);" +
//             "location.href = url;}</script>";
//         html += "</head>";

//         html += "<body><h1>OPDS feed browser</h1>";

//         html += "<form onsubmit=\"go();return false;\">" +
//             "<input type=\"text\" name=\"url\" id=\"url\" size=\"80\">" +
//             "<input type=\"submit\" value=\"Go!\"></form>";

//         html += "</body></html>";

//         res.status(200).send(html);
//     });

//     routerOPDS_browse_v1.param("urlEncoded", (req, _res, next, value, _name) => {
//         // Express 4 -> 5 wildcard (new router / path-to-regexp parser)
//         if (typeof value !== "string") {
//             if (Array.isArray(value)) {
//                 value = value.join("/");
//             }
//         }
//         (req as IRequestPayloadExtension).urlEncoded = value;
//         next();
//     });

//     // RegExp.escape() NOT AVAILABLE in NodeJS yet new RegExp(RegExp.escape())
//     // routerOPDS_browse_v1.get(new RegExp(regexpEscape("/:" + _urlEncoded) + "(.*)"), async (req: express.Request, res: express.Response) => {
//     routerOPDS_browse_v1.get("/*" + _urlEncoded, async (req: express.Request, res: express.Response) => {
//     // Express 4 -> 5 wildcard (new router / path-to-regexp parser)
//     // routerOPDS_browse_v1.get("/:" + _urlEncoded + "(*)", async (req: express.Request, res: express.Response) => {

//         const reqparams = (req as IRequestPayloadExtension).params;

//         if (!reqparams.urlEncoded) {
//             reqparams.urlEncoded = (req as IRequestPayloadExtension).urlEncoded;
//         }
//         if (reqparams.urlEncoded && typeof reqparams.urlEncoded !== "string") {
//             if (Array.isArray(reqparams.urlEncoded)) {
//                 reqparams.urlEncoded = (reqparams.urlEncoded as []).join("/");
//             }
//         }

//         const urlDecoded = reqparams.urlEncoded;
//         // if (urlDecoded.substr(-1) === "/") {
//         //     urlDecoded = urlDecoded.substr(0, urlDecoded.length - 1);
//         // }
//         debug(urlDecoded);

//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         const failure = (err: any) => {
//             debug(err);
//             res.status(500).send("<html><body><p>Internal Server Error</p><p>"
//                 + err + "</p></body></html>");
//         };

//         const success = async (response: request.RequestResponse) => {

//             // Object.keys(response.headers).forEach((header: string) => {
//             //     debug(header + " => " + response.headers[header]);
//             // });

//             if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
//                 failure("HTTP CODE " + response.statusCode);
//                 return;
//             }

//             let responseData: Buffer;
//             try {
//                 responseData = await streamToBufferPromise(response);
//             } catch (err) {
//                 debug(err);
//                 res.status(500).send("<html><body><p>Internal Server Error</p><p>"
//                     + err + "</p></body></html>");
//                 return;
//             }
//             const responseStr = removeUTF8BOM(responseData.toString("utf8"));
//             const responseXml = new xmldom.DOMParser().parseFromString(responseStr, "application/xml") as unknown as Document;
//             // debug(responseXml);
//             if (!responseXml || !responseXml.documentElement) {
//                 res.status(500).send("<html><body><p>Internal Server Error</p><p>"
//                     + "XML parse fail" + "</p></body></html>");
//                 return;
//             }
//             const isEntry = responseXml.documentElement.localName === "entry";
//             let opds: OPDS | undefined;
//             let opdsEntry: Entry | undefined;
//             if (isEntry) {
//                 opdsEntry = XML.deserialize<Entry>(responseXml, Entry);
//             } else {
//                 opds = XML.deserialize<OPDS>(responseXml, OPDS);
//             }

//             // // breakLength: 100  maxArrayLength: undefined
//             // console.log(util.inspect(opds,
//             //     { showHidden: false, depth: 1000, colors: true, customInspect: true }));

//             let html = "<html><head>";
//             html += "</head>";
//             html += "<body><h1>" + urlDecoded + "</h1>";
//             if (opds && opds.Title) {
//                 html += "<h2>" + opds.Title + "</h2>";
//             }
//             if (opdsEntry && opdsEntry.Title) {
//                 html += "<h2>" + opdsEntry.Title + "</h2>";
//             }
//             if (opds && opds.Icon) {
//                 const iconUrl = ensureAbsolute(urlDecoded, opds.Icon);
//                 html += "<img src='" + iconUrl + "' alt='' />";
//             }
//             // if (opds.Updated) {
//             //     html += "<h3>" + opds.Updated.toUTCString() + "</h3>";
//             //     html += "<h3>" + opds.Updated.toDateString() + "</h3>";
//             //     html += "<h3>" + opds.Updated.toISOString() + "</h3>";
//             //     html += "<h3>" + opds.Updated.toTimeString() + "</h3>";
//             // }
//             const links = opds ? opds.Links : (opdsEntry ? opdsEntry.Links : undefined);
//             if (links && links.length) {
//                 html += "<p>";
//                 links.forEach((link) => {
//                     if (link.Type &&
//                         (link.Type.indexOf("opds-catalog") >= 0 || link.Type === "application/atom+xml")) {
//                         const linkUrl = ensureAbsolute(urlDecoded, link.Href);
//                         const opdsUrl = req.originalUrl.substr(0,
//                             req.originalUrl.indexOf(serverOPDS_browse_v1_PATH + "/"))
//                             + serverOPDS_browse_v1_PATH + "/" + encodeURIComponent_RFC3986(linkUrl);

//                         html += "<a href='" + opdsUrl
//                             + "'>" + link.Href + "</a> (TITLE: " + link.Title
//                             + ") [REL: " + link.Rel + "]<br/>";
//                     }
//                 });
//                 html += "</p>";
//             }

//             function processEntry(entry: Entry) {

//                 html += "<hr/>";
//                 html += "<div>";
//                 if (opds) {
//                     html += "<h3>" + entry.Title + "</h3>";
//                 }
//                 if (entry.Summary) {
//                     if (!entry.SummaryType || entry.SummaryType === "text") {
//                         html += "<strong>" + entry.Summary + "</strong>";
//                     } else if (entry.SummaryType === "html") {
//                         html += "<div>" + entry.Summary + "</div>";
//                     }
//                     html += "<br/>";
//                 }
//                 if (entry.Content) {
//                     if (!entry.ContentType || entry.ContentType === "text") {
//                         html += "<strong>" + entry.Content + "</strong>";
//                     } else if (entry.ContentType === "html") {
//                         html += "<div>" + entry.Content + "</div>";
//                     }
//                     html += "<br/>";
//                 }
//                 if (entry.Links && entry.Links.length) {
//                     let image: string | undefined;
//                     let imageThumbnail: string | undefined;
//                     let epub: string | undefined;
//                     entry.Links.forEach((link) => {
//                         if (link.Type === "application/epub+zip") {
//                             epub = link.Href;
//                         }
//                         if (link.HasRel("http://opds-spec.org/image")
//                             || link.HasRel("x-stanza-cover-image")) {
//                             image = link.Href;
//                         }
//                         if (link.HasRel("http://opds-spec.org/image/thumbnail")
//                             || link.HasRel("http://opds-spec.org/thumbnail")
//                             || link.HasRel("x-stanza-cover-image-thumbnail")) {
//                             imageThumbnail = link.Href;
//                         }

//                         if (opds && link.Type &&
//                             (link.Type.indexOf("opds-catalog") >= 0 || link.Type === "application/atom+xml")) {
//                             const linkUrl = ensureAbsolute(urlDecoded, link.Href);
//                             const opdsUrl = req.originalUrl.substr(0,
//                                 req.originalUrl.indexOf(serverOPDS_browse_v1_PATH + "/"))
//                                 + serverOPDS_browse_v1_PATH + "/" + encodeURIComponent_RFC3986(linkUrl);

//                             html += "<a href='" + opdsUrl
//                                 + "'>" + link.Href + "</a> (TITLE: " + link.Title
//                                 + ") [REL: " + link.Rel + "]<br/>";
//                         } else if (opds && link.Type &&
//                             (link.Type === "application/vnd.readium.lcp.license.v1.0+json")
//                             // && obj.rel === "http://opds-spec.org/acquisition"
//                         ) {
//                             const linkUrl = ensureAbsolute(urlDecoded, link.Href);
//                             const opdsUrl = req.originalUrl.substr(0,
//                                 req.originalUrl.indexOf(serverOPDS_browse_v1_PATH + "/"))
//                                 + serverLCPLSD_show_PATH + "/" + encodeURIComponent_RFC3986(linkUrl);

//                             html += "<a href='" + opdsUrl
//                                 + "'>" + link.Href + "</a> (TITLE: " + link.Title
//                                 + ") [REL: " + link.Rel + "]<br/>";
//                         }
//                     });
//                     if (imageThumbnail) {
//                         const imageThumbnailUrl = ensureAbsolute(urlDecoded, imageThumbnail);
//                         if (image) {
//                             const imageUrl = ensureAbsolute(urlDecoded, image);
//                             html += "<a href='" + imageUrl + "'><img src='"
//                                 + imageThumbnailUrl + "' alt='' /></a><br/>";
//                         } else {
//                             html += "<img src='" + imageThumbnailUrl + "' alt='' /><br/>";
//                         }
//                     } else if (image) {
//                         const imageUrl = ensureAbsolute(urlDecoded, image);
//                         html += "<img src='" + imageUrl + "' alt='' /><br/>";
//                     }
//                     if (epub) {
//                         const epub_ = ensureAbsolute(urlDecoded, epub);
//                         const epubUrl = req.originalUrl.substr(0,
//                             req.originalUrl.indexOf(serverOPDS_browse_v1_PATH + "/"))
//                             + serverRemotePub_PATH + "/" + encodeURIComponent_RFC3986(epub_);

//                         html += "<strong><a href='" + epubUrl + "'>" + epub + "</a></strong>";
//                     }
//                 }
//                 html += "</div>";
//             }

//             if (opds && opds.Entries && opds.Entries.length) {
//                 opds.Entries.forEach((entry) => {
//                     processEntry(entry);
//                 });
//             }
//             if (opdsEntry) {
//                 processEntry(opdsEntry);
//             }

//             html += "</body></html>";

//             res.status(200).send(html);
//         };

//         const headers = {
//             "Accept": "application/json,application/xml",
//             "Accept-Language": "en-UK,en-US;q=0.7,en;q=0.5",
//             "User-Agent": "READIUM2",
//         };

//         // // No response streaming! :(
//         // // https://github.com/request/request-promise/issues/90
//         // const needsStreamingResponse = true;
//         // if (needsStreamingResponse) {
//             request.get({
//                 headers,
//                 method: "GET",
//                 uri: urlDecoded,
//             })
//                 .on("response", async (res) => {
//                     try {
//                         await success(res);
//                     }
//                     catch (successError) {
//                         failure(successError);
//                         return;
//                     }
//                 })
//                 .on("error", failure);
//         // } else {
//         //     let response: requestPromise.FullResponse;
//         //     try {
//         //         // tslint:disable-next-line:await-promise no-floating-promises
//         //         response = await requestPromise({
//         //             headers,
//         //             method: "GET",
//         //             resolveWithFullResponse: true,
//         //             uri: urlDecoded,
//         //         });
//         //     } catch (err) {
//         //         failure(err);
//         //         return;
//         //     }

//         //     await success(response);
//         // }
//     });

//     topRouter.use(serverOPDS_browse_v1_PATH, routerOPDS_browse_v1);
// }
