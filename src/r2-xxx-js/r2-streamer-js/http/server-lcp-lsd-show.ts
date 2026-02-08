// // ==LICENSE-BEGIN==
// // Copyright 2017 European Digital Reading Lab. All rights reserved.
// // Licensed to the Readium Foundation under one or more contributor license agreements.
// // Use of this source code is governed by a BSD-style license
// // that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// // ==LICENSE-END==

// // import * as regexpEscape from "regexp.escape";

// import * as css2json from "css2json";
// import debug_ from "debug";
// import * as DotProp from "dot-prop";
// import * as express from "express";
// import * as jsonMarkup from "json-markup";
// import * as morgan from "morgan";
// import * as path from "path";
// import * as request from "request";
// // import * as requestPromise from "request-promise-native";

// import { LCP } from "@r2-lcp-js/parser/epub/lcp";
// import { LSD } from "@r2-lcp-js/parser/epub/lsd";
// import { TaJsonDeserialize, TaJsonSerialize } from "@r2-lcp-js/serializable";
// import {
//     encodeURIComponent_RFC3986, ensureAbsolute, isHTTP,
// } from "@r2-utils-js/_utils/http/UrlUtils";
// import { traverseJsonObjects } from "@r2-utils-js/_utils/JsonUtils";
// import { streamToBufferPromise } from "@r2-utils-js/_utils/stream/BufferUtils";

// import { jsonSchemaValidate } from "../utils/json-schema-validate";
// import { IRequestPayloadExtension, _urlEncoded } from "./request-ext";
// import { Server } from "./server";
// import { trailingSlashRedirect } from "./server-trailing-slash-redirect";
// import { serverRemotePub_PATH } from "./server-url";

// const debug = debug_("r2:streamer#http/lcp-lsd-show");

// // tslint:disable-next-line:variable-name
// export const serverLCPLSD_show_PATH = "/lcp-lsd-show";

// export function serverLCPLSD_show(_server: Server, topRouter: express.Application) {

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
//     const routerLCPLSD_show = express.Router({ strict: false });
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     routerLCPLSD_show.use(morgan("combined", { stream: { write: (msg: any) => debug(msg) } }));

//     routerLCPLSD_show.use(trailingSlashRedirect);

//     routerLCPLSD_show.get("/", (_req: express.Request, res: express.Response) => {

//         let html = "<html><head>";
//         html += "<script type=\"text/javascript\">function encodeURIComponent_RFC3986(str) { " +
//             "return encodeURIComponent(str).replace(/[!'()*]/g, (c) => { " +
//             "return \"%\" + c.charCodeAt(0).toString(16); }); }" +
//             "function go(evt) {" +
//             "if (evt) { evt.preventDefault(); } var url = " +
//             "location.origin +" +
//             // `location.protocol + '//' + location.hostname + ` +
//             // `(location.port ? (':' + location.port) : '') + ` +
//             ` '${serverLCPLSD_show_PATH}/' +` +
//             " encodeURIComponent_RFC3986(document.getElementById(\"url\").value);" +
//             "location.href = url;}</script>";
//         html += "</head>";

//         html += "<body><h1>LCP / LSD examiner</h1>";

//         html += "<form onsubmit=\"go();return false;\">" +
//             "<input type=\"text\" name=\"url\" id=\"url\" size=\"80\">" +
//             "<input type=\"submit\" value=\"Go!\"></form>";

//         html += "</body></html>";

//         res.status(200).send(html);
//     });

//     routerLCPLSD_show.param("urlEncoded", (req, _res, next, value, _name) => {
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
//     // routerLCPLSD_show.get(new RegExp(regexpEscape("/:" + _urlEncoded) + "(.*)"), async (req: express.Request, res: express.Response) => {
//     routerLCPLSD_show.get("/*" + _urlEncoded, async (req: express.Request, res: express.Response) => {
//     // Express 4 -> 5 wildcard (new router / path-to-regexp parser)
//     // routerLCPLSD_show.get("/:" + _urlEncoded + "(*)", async (req: express.Request, res: express.Response) => {

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

//         const isSecureHttp = req.secure ||
//             req.protocol === "https" ||
//             req.get("X-Forwarded-Proto") === "https"
//             ;
//         const rootUrl = (isSecureHttp ? "https://" : "http://")
//             + req.headers.host;

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

//             const isBadStatusCode = response.statusCode && (response.statusCode < 200 || response.statusCode >= 300);
//             if (isBadStatusCode) {
//                 failure("HTTP CODE " + response.statusCode);
//                 return;
//             }

//             let responseData: Buffer;
//             try {
//                 responseData = await streamToBufferPromise(response);
//             } catch (err) {
//                 debug(err);
//                 res.status(500).send("<html><body><p>Internal Server Error</p><p>" + err + "</p></body></html>");
//                 return;
//             }
//             const responseStr = responseData.toString("utf8");
//             const responseJson = JSON.parse(responseStr);

//             const isStatusDoc = responseJson.id &&
//                 responseJson.status &&
//                 responseJson.updated &&
//                 responseJson.links;

//             const lcpOrLsd: LCP | LSD =
//                 isStatusDoc ?
//                 // tslint:disable-next-line: max-line-length
//                 TaJsonDeserialize<LSD>(responseJson, LSD) : // "application/vnd.readium.license.status.v1.0+json"
//                 // tslint:disable-next-line: max-line-length
//                 TaJsonDeserialize<LCP>(responseJson, LCP); // "application/vnd.readium.lcp.license.v1.0+json"

//             const lcpOrLsdJson = TaJsonSerialize(lcpOrLsd);

//             let validationStr: string | undefined;
//             const doValidate = !reqparams.jsonPath || reqparams.jsonPath === "all";
//             if (doValidate) {

//                 const jsonSchemasRootpath = path.join(process.cwd(), "misc", "json-schema");
//                 const jsonSchemasNames = [
//                     isStatusDoc ? "lcp/status" : "lcp/license",
//                     "lcp/link",
//                 ];
//                 // debug(jsonSchemasNames);

//                 const validationErrors =
//                     jsonSchemaValidate(jsonSchemasRootpath, jsonSchemasNames, lcpOrLsdJson);
//                 if (validationErrors) {
//                     validationStr = "";

//                     for (const err of validationErrors) {

//                         debug("JSON Schema validation FAIL.");
//                         debug(err);

//                         const val = err.jsonPath ? DotProp.get(lcpOrLsdJson, err.jsonPath) : "";
//                         const valueStr = (typeof val === "string") ?
//                             `${val}` :
//                             ((val instanceof Array || typeof val === "object") ?
//                             `${JSON.stringify(val)}` :
//                                 "");
//                         debug(valueStr);

//                         validationStr +=
//                         // tslint:disable-next-line:max-line-length
//                         `\n${err.ajvMessage}: ${valueStr}\n\n'${err.ajvDataPath?.replace(/^\./, "")}' (${err.ajvSchemaPath})\n\n`;
//                     }
//                 }
//             }

//             // eslint-disable-next-line @typescript-eslint/no-explicit-any
//             const funk = (obj: any) => {
//                 if ((obj.href && typeof obj.href === "string") ||
//                     (obj.Href && typeof obj.Href === "string")) {

//                     let fullHref = obj.href ? obj.href as string : obj.Href as string;

//                     const isDataUrl = /^data:/.test(fullHref);
//                     const isMailUrl = /^mailto:/.test(fullHref);
//                     const notFull = !isDataUrl && !isMailUrl && !isHTTP(fullHref);
//                     if (notFull) {
//                         fullHref = ensureAbsolute(urlDecoded, fullHref);
//                     }

//                     if ((obj.type === "application/vnd.readium.license.status.v1.0+json" && obj.rel === "status") ||
//                         (obj.type === "application/vnd.readium.lcp.license.v1.0+json" && obj.rel === "license")) {

//                         obj.__href__ = rootUrl + req.originalUrl.substr(0,
//                             req.originalUrl.indexOf(serverLCPLSD_show_PATH + "/")) +
//                             serverLCPLSD_show_PATH + "/" + encodeURIComponent_RFC3986(fullHref);

//                     } else if (obj.type === "application/epub+zip" && obj.rel === "publication") {

//                         obj.__href__ = rootUrl + req.originalUrl.substr(0,
//                             req.originalUrl.indexOf(serverLCPLSD_show_PATH + "/")) +
//                             serverRemotePub_PATH + "/" + encodeURIComponent_RFC3986(fullHref);

//                     } else if (isDataUrl) {
//                         // obj.href = obj.href.substr(0, 100) + "(...)";
//                         // obj.__href__ = rootUrl + req.originalUrl.substr(0,
//                         //     req.originalUrl.indexOf(serverLCPLSD_show_PATH + "/")) +
//                         //     serverLCPLSD_dataUrl_PATH + "/" + encodeURIComponent_RFC3986(fullHref);

//                     } else if (notFull && !isMailUrl) {
//                         obj.__href__ = fullHref;
//                     }
//                 }
//             };
//             traverseJsonObjects(lcpOrLsdJson, funk);

//             const css = css2json(jsonStyle);
//             const jsonPretty = jsonMarkup(lcpOrLsdJson, css);

//             res.status(200).send("<html><body>" +
//                 "<h1>" +
//                 (isStatusDoc ? "LSD" : "LCP") +
//                 " JSON" + "</h1>" +
//                 "<h2><a href=\"" + urlDecoded + "\">" + urlDecoded + "</a></h2>" +
//                 "<hr>" +
//                 "<div style=\"overflow-x: auto;margin:0;padding:0;width:100%;height:auto;\">" +
//                 jsonPretty + "</div>" +
//                 // tslint:disable-next-line:max-line-length
//                 (doValidate ? (validationStr ? ("<hr><p><pre>" + validationStr + "</pre></p>") : ("<hr><p>JSON SCHEMA OK.</p>")) : "") +
//                 // "<p><pre>" + jsonPretty + "</pre></p>" +
//                 // "<hr><p><pre>" + jsonStr + "</pre></p>" +
//                 // "<p><pre>" + dumpStr + "</pre></p>" +
//                 "</body></html>");
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

//     topRouter.use(serverLCPLSD_show_PATH, routerLCPLSD_show);
// }
