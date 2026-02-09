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
// import * as xmldom from "@xmldom/xmldom";

// import { TaJsonSerialize } from "@r2-lcp-js/serializable";
// import {
//     convertOpds1ToOpds2, convertOpds1ToOpds2_EntryToPublication,
// } from "@r2-opds-js/opds/converter";
// import { OPDS } from "@r2-opds-js/opds/opds1/opds";
// import { Entry } from "@r2-opds-js/opds/opds1/opds-entry";
// import { OPDSFeed } from "@r2-opds-js/opds/opds2/opds2";
// import { OPDSPublication } from "@r2-opds-js/opds/opds2/opds2-publication";
// import {
//     encodeURIComponent_RFC3986, ensureAbsolute, isHTTP,
// } from "@r2-utils-js/_utils/http/UrlUtils";
// import { traverseJsonObjects } from "@r2-utils-js/_utils/JsonUtils";
// import { streamToBufferPromise } from "@r2-utils-js/_utils/stream/BufferUtils";
// import { XML } from "@r2-utils-js/_utils/xml-js-mapper";
// import { removeUTF8BOM } from "@r2-utils-js/_utils/bom";

// import { jsonSchemaValidate } from "../utils/json-schema-validate";
// import { IRequestPayloadExtension, _urlEncoded } from "./request-ext";
// import { Server } from "./server";
// import { trailingSlashRedirect } from "./server-trailing-slash-redirect";

// const debug = debug_("r2:streamer#http/server-opds-convert-v1-to-v2");

// // tslint:disable-next-line:variable-name
// export const serverOPDS_convert_v1_to_v2_PATH = "/opds-v1-v2-convert";
// export function serverOPDS_convert_v1_to_v2(_server: Server, topRouter: express.Application) {

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
//     const routerOPDS_convert_v1_to_v2 = express.Router({ strict: false });
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     routerOPDS_convert_v1_to_v2.use(morgan("combined", { stream: { write: (msg: any) => debug(msg) } }));

//     routerOPDS_convert_v1_to_v2.use(trailingSlashRedirect);

//     routerOPDS_convert_v1_to_v2.get("/", (_req: express.Request, res: express.Response) => {

//         let html = "<html><head>";
//         html += "<script type=\"text/javascript\">function encodeURIComponent_RFC3986(str) { " +
//             "return encodeURIComponent(str).replace(/[!'()*]/g, (c) => { " +
//             "return \"%\" + c.charCodeAt(0).toString(16); }); }" +
//             "function go(evt) {" +
//             "if (evt) { evt.preventDefault(); } var url = " +
//             "location.origin +" +
//             // `location.protocol + '//' + location.hostname + ` +
//             // `(location.port ? (':' + location.port) : '') + ` +
//             ` '${serverOPDS_convert_v1_to_v2_PATH}/' +` +
//             " encodeURIComponent_RFC3986(document.getElementById(\"url\").value);" +
//             "location.href = url;}</script>";
//         html += "</head>";

//         html += "<body><h1>OPDS 1 -> 2 converter</h1>";

//         html += "<form onsubmit=\"go();return false;\">" +
//             "<input type=\"text\" name=\"url\" id=\"url\" size=\"80\">" +
//             "<input type=\"submit\" value=\"Go!\"></form>";

//         html += "</body></html>";

//         res.status(200).send(html);
//     });

//     routerOPDS_convert_v1_to_v2.param("urlEncoded", (req, _res, next, value, _name) => {
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
//     // routerOPDS_convert_v1_to_v2.get(new RegExp(regexpEscape("/:" + _urlEncoded) + "(.*)"),
//     routerOPDS_convert_v1_to_v2.get("/*" + _urlEncoded,
//     // Express 4 -> 5 wildcard (new router / path-to-regexp parser)
//     // routerOPDS_convert_v1_to_v2.get("/:" + _urlEncoded + "(*)",
//         async (req: express.Request, res: express.Response) => {

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
//             let opds1Feed: OPDS | undefined;
//             let opds1Entry: Entry | undefined;
//             let opds2Feed: OPDSFeed | undefined;
//             let opds2Publication: OPDSPublication | undefined;
//             if (isEntry) {
//                 opds1Entry = XML.deserialize<Entry>(responseXml, Entry);

//                 try {
//                     opds2Publication = convertOpds1ToOpds2_EntryToPublication(opds1Entry);
//                     // debug(opds2Publication);

//                     // // breakLength: 100  maxArrayLength: undefined
//                     // console.log(util.inspect(opds2Publication,
//                     //     { showHidden: false, depth: 1000, colors: true, customInspect: true }));
//                 } catch (err) {
//                     debug("OPDS 1 -> 2 conversion FAILED (Entry)");
//                     debug(err);

//                     res.status(500).send("<html><body><p>Internal Server Error</p><p>"
//                         + err + "</p></body></html>");
//                     return;
//                 }
//             } else {
//                 opds1Feed = XML.deserialize<OPDS>(responseXml, OPDS);

//                 try {
//                     opds2Feed = convertOpds1ToOpds2(opds1Feed);
//                     // debug(opds2Feed);

//                     // // breakLength: 100  maxArrayLength: undefined
//                     // console.log(util.inspect(opds2Feed,
//                     //     { showHidden: false, depth: 1000, colors: true, customInspect: true }));
//                 } catch (err) {
//                     debug("OPDS 1 -> 2 conversion FAILED");
//                     debug(err);

//                     res.status(500).send("<html><body><p>Internal Server Error</p><p>"
//                         + err + "</p></body></html>");
//                     return;
//                 }
//             }

//             // eslint-disable-next-line @typescript-eslint/no-explicit-any
//             const funk = (obj: any) => {
//                 if ((obj.href && typeof obj.href === "string") ||
//                     (obj.Href && typeof obj.Href === "string")) {

//                     let fullHref = obj.href ? obj.href as string : obj.Href as string;

//                     const notFull = !isHTTP(fullHref);
//                     if (notFull) {
//                         fullHref = ensureAbsolute(urlDecoded, fullHref);
//                     }

//                     if ((obj.type && obj.type.indexOf("application/atom+xml") >= 0) ||
//                         (obj.Type && obj.Type.indexOf("application/atom+xml") >= 0)) {
//                         obj.__href__ = rootUrl + req.originalUrl.substr(0,
//                             req.originalUrl.indexOf(serverOPDS_convert_v1_to_v2_PATH + "/")) +
//                             serverOPDS_convert_v1_to_v2_PATH + "/" + encodeURIComponent_RFC3986(fullHref);
//                     } else if (notFull) {
//                         obj.__href__ = fullHref;
//                     }
//                 }
//             };

//             const jsonObjOPDS1 = TaJsonSerialize(opds1Entry ? opds1Entry : opds1Feed);
//             traverseJsonObjects(jsonObjOPDS1, funk);

//             const jsonObjOPDS2 = TaJsonSerialize(opds2Publication ? opds2Publication : opds2Feed);

//             let validationStr: string | undefined;
//             const doValidate = !reqparams.jsonPath || reqparams.jsonPath === "all";
//             if (doValidate) {

//                 const jsonSchemasRootpath = path.join(process.cwd(), "misc", "json-schema");
//                 const jsonSchemasNames = [
//                     "opds/publication",
//                     "opds/acquisition-object",
//                     "opds/catalog-entry",
//                     "opds/feed-metadata",
//                     "opds/properties",
//                     // "opds/authentication",
//                     "webpub-manifest/publication",
//                     "webpub-manifest/contributor-object",
//                     "webpub-manifest/contributor",
//                     "webpub-manifest/link",
//                     "webpub-manifest/a11y",
//                     "webpub-manifest/metadata",
//                     "webpub-manifest/subcollection",
//                     // "webpub-manifest/properties",
//                     "webpub-manifest/subject",
//                     "webpub-manifest/subject-object",
//                     "webpub-manifest/extensions/epub/metadata",
//                     "webpub-manifest/extensions/epub/subcollections",
//                     "webpub-manifest/extensions/epub/properties",
//                     "webpub-manifest/extensions/presentation/metadata",
//                     "webpub-manifest/extensions/presentation/properties",
//                     "webpub-manifest/language-map",
//                 ];
//                 if (!opds2Publication) {
//                     jsonSchemasNames.unshift("opds/feed"); // must be first!
//                 }
//                 // debug(jsonSchemasNames);

//                 const validationErrors =
//                     jsonSchemaValidate(jsonSchemasRootpath, jsonSchemasNames, jsonObjOPDS2);
//                 if (validationErrors) {
//                     validationStr = "";

//                     for (const err of validationErrors) {

//                         debug("JSON Schema validation FAIL.");
//                         debug(err);

//                         if (opds2Publication) {
//                             const val = err.jsonPath ? DotProp.get(jsonObjOPDS2, err.jsonPath) : "";
//                             const valueStr = (typeof val === "string") ?
//                                 `${val}` :
//                                 ((val instanceof Array || typeof val === "object") ?
//                                 `${JSON.stringify(val)}` :
//                                     "");
//                             debug(valueStr);

//                             const title = DotProp.get(jsonObjOPDS2, "metadata.title");
//                             debug(title);

//                             validationStr +=
//                             // tslint:disable-next-line:max-line-length
//                             `\n"${title}"\n\n${err.ajvMessage}: ${valueStr}\n\n'${err.ajvDataPath?.replace(/^\./, "")}' (${err.ajvSchemaPath})\n\n`;
//                         } else {
//                             const val = err.jsonPath ? DotProp.get(jsonObjOPDS2, err.jsonPath) : "";
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
//                                 title = DotProp.get(jsonObjOPDS2, jsonPubTitlePath);
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
//             }

//             traverseJsonObjects(jsonObjOPDS2, funk);

//             const css = css2json(jsonStyle);
//             const jsonPrettyOPDS1 = jsonMarkup(jsonObjOPDS1, css);
//             const jsonPrettyOPDS2 = jsonMarkup(jsonObjOPDS2, css);

//             res.status(200).send("<html><body>" +
//                 "<h1>OPDS2 JSON " +
//                 (opds2Publication ? "entry" : "feed") +
//                 " (converted from OPDS1 XML/ATOM)</h1>" +
//                 "<h2><a href=\"" + urlDecoded + "\">" + urlDecoded + "</a></h2>" +
//                 "<hr>" +
//                 "<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"90%\" " +
//                 "style=\"table-layout:fixed;width:90%\">" +
//                 "<thead><tr><th>OPDS1</th><th>OPDS2</th></tr></thead>" +
//                 "<tbody><tr>" +
//                 "<td valign=\"top\" width=\"50%\">" +
//                 "<div style=\"overflow-x: auto;margin:0;padding:0;width:100%;height:auto;\">" +
//                 jsonPrettyOPDS1 + "</div></td>" +
//                 "<td valign=\"top\" width=\"50%\">" +
//                 "<div style=\"overflow-x: auto;margin:0;padding:0;width:100%;height:auto;\">" +
//                 jsonPrettyOPDS2 + "</div></td>" +
//                 "</tbody></tr>" +
//                 "</table>" +
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

//     topRouter.use(serverOPDS_convert_v1_to_v2_PATH, routerOPDS_convert_v1_to_v2);
// }
