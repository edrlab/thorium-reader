// // ==LICENSE-BEGIN==
// // Copyright 2017 European Digital Reading Lab. All rights reserved.
// // Licensed to the Readium Foundation under one or more contributor license agreements.
// // Use of this source code is governed by a BSD-style license
// // that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// // ==LICENSE-END==

// // import * as regexpEscape from "regexp.escape";

// import * as crypto from "crypto";
// import * as css2json from "css2json";
// import debug_ from "debug";
// import * as DotProp from "dot-prop";
// import * as express from "express";
// import * as jsonMarkup from "json-markup";
// import * as morgan from "morgan";
// import * as path from "path";
// import * as request from "request";
// // import * as requestPromise from "request-promise-native";
// import { v4 as uuidv4 } from "uuid";

// import { TaJsonDeserialize, TaJsonSerialize } from "@r2-lcp-js/serializable";
// import { OPDSFeed } from "@r2-opds-js/opds/opds2/opds2";
// import { OPDSAuthenticationDoc } from "@r2-opds-js/opds/opds2/opds2-authentication-doc";
// import { OPDSPublication } from "@r2-opds-js/opds/opds2/opds2-publication";
// import {
//     encodeURIComponent_RFC3986, ensureAbsolute, isHTTP,
// } from "@r2-utils-js/_utils/http/UrlUtils";
// import { traverseJsonObjects } from "@r2-utils-js/_utils/JsonUtils";
// import { streamToBufferPromise } from "@r2-utils-js/_utils/stream/BufferUtils";

// import { jsonSchemaValidate } from "../utils/json-schema-validate";
// import {
//     IRequestPayloadExtension, IRequestQueryParams, _authRefresh, _authRequest, _authResponse,
//     _urlEncoded,
// } from "./request-ext";
// import { Server } from "./server";
// import { serverLCPLSD_show_PATH } from "./server-lcp-lsd-show";
// import { serverOPDS_convert_v1_to_v2_PATH } from "./server-opds-convert-v1-to-v2";
// import { trailingSlashRedirect } from "./server-trailing-slash-redirect";

// const debug = debug_("r2:streamer#http/server-opds-browse-v2");

// // tslint:disable-next-line:variable-name
// export const serverOPDS_browse_v2_PATH = "/opds-v2-browse";

// // tslint:disable-next-line:variable-name
// export const serverOPDS_dataUrl_PATH = "/data-url";

// // tslint:disable-next-line:variable-name
// export const serverOPDS_auth_PATH = "/opds-auth";

// const salt = crypto.randomBytes(16).toString("hex");
// const OPDS_AUTH_ENCRYPTION_KEY_BUFFER = crypto.pbkdf2Sync(uuidv4(), salt, 1000, 32, "sha256");
// const OPDS_AUTH_ENCRYPTION_KEY_HEX = OPDS_AUTH_ENCRYPTION_KEY_BUFFER.toString("hex");

// const AES_BLOCK_SIZE = 16;
// const OPDS_AUTH_ENCRYPTION_IV_BUFFER = Buffer.from(uuidv4()).slice(0, AES_BLOCK_SIZE);
// const OPDS_AUTH_ENCRYPTION_IV_HEX = OPDS_AUTH_ENCRYPTION_IV_BUFFER.toString("hex");

// export function serverOPDS_browse_v2(_server: Server, topRouter: express.Application) {

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
//     const routerOPDS_browse_v2 = express.Router({ strict: false });
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     routerOPDS_browse_v2.use(morgan("combined", { stream: { write: (msg: any) => debug(msg) } }));

//     routerOPDS_browse_v2.use(trailingSlashRedirect);

//     routerOPDS_browse_v2.get("/", (_req: express.Request, res: express.Response) => {

//         let html = "<html><head>";
//         html += "<script type=\"text/javascript\">function encodeURIComponent_RFC3986(str) { " +
//             "return encodeURIComponent(str).replace(/[!'()*]/g, (c) => { " +
//             "return \"%\" + c.charCodeAt(0).toString(16); }); }" +
//             "function go(evt) {" +
//             "if (evt) { evt.preventDefault(); } var url = " +
//             "location.origin +" +
//             // `location.protocol + '//' + location.hostname + ` +
//             // `(location.port ? (':' + location.port) : '') + ` +
//             ` '${serverOPDS_browse_v2_PATH}/' +` +
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

//     routerOPDS_browse_v2.param("urlEncoded", (req, _res, next, value, _name) => {
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
//     // routerOPDS_browse_v2.get(new RegExp(regexpEscape("/:" + _urlEncoded) + "(.*)"), async (req: express.Request, res: express.Response) => {
//     routerOPDS_browse_v2.get("/*" + _urlEncoded, async (req: express.Request, res: express.Response) => {
//     // Express 4 -> 5 wildcard (new router / path-to-regexp parser)
//     // routerOPDS_browse_v2.get("/:" + _urlEncoded + "(*)", async (req: express.Request, res: express.Response) => {

//         const reqparams = (req as IRequestPayloadExtension).params;

//         if (!reqparams.urlEncoded) {
//             reqparams.urlEncoded = (req as IRequestPayloadExtension).urlEncoded;
//         }
//         if (reqparams.urlEncoded && typeof reqparams.urlEncoded !== "string") {
//             if (Array.isArray(reqparams.urlEncoded)) {
//                 reqparams.urlEncoded = (reqparams.urlEncoded as []).join("/");
//             }
//         }

//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         let authResponseJson: any | undefined;
//         const authResponseBase64 = (req.query as IRequestQueryParams).authResponse;
//         if (authResponseBase64) {
//             try {
//                 const authResponseStr = Buffer.from(authResponseBase64, "base64").toString("utf8");
//                 authResponseJson = JSON.parse(authResponseStr);
//             } catch (err) {
//                 debug(err);
//             }
//         }
//         const authRequestBase64 = (req.query as IRequestQueryParams).authRequest;

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

//             const isAuthStatusCode = response.statusCode === 401;

//             if (isAuthStatusCode && // comment this to test refresh_token
//                 authRequestBase64 && authResponseJson && authResponseJson.refresh_token) {

//                 const redirectUrl = rootUrl + req.originalUrl.substr(0,
//                     req.originalUrl.indexOf(serverOPDS_browse_v2_PATH + "/")) +
//                     serverOPDS_auth_PATH + "/" + encodeURIComponent_RFC3986(authRequestBase64) +
//                     "?" + _authRefresh + "=" + authResponseJson.refresh_token;

//                 debug(`REDIRECT: ${req.originalUrl} ==> ${redirectUrl}`);
//                 res.redirect(301, redirectUrl);
//                 return;
//             }

//             const isBadStatusCode = response.statusCode && (response.statusCode < 200 || response.statusCode >= 300);
//             if (!isAuthStatusCode && isBadStatusCode) {
//                 failure("HTTP CODE " + response.statusCode);
//                 return;
//             }

//             let responseData: Buffer;
//             try {
//                 responseData = await streamToBufferPromise(response);
//             } catch (err) {
//                 debug(err);
//                 res.status(500).send("<html><body><p>Internal Server Error</p><p>"
//                     + err + (isAuthStatusCode ? " (Auth 401)" : "") + "</p></body></html>");
//                 return;
//             }
//             const responseStr = responseData.toString("utf8");
//             const responseJson = JSON.parse(responseStr);

//             const isPublication = !responseJson.publications &&
//                 !responseJson.navigation &&
//                 !responseJson.groups &&
//                 !responseJson.catalogs &&
//                 responseJson.metadata;
//             const isAuth = !isPublication && responseJson.authentication;

//             const opds2Feed: OPDSPublication | OPDSFeed | OPDSAuthenticationDoc =
//                 // tslint:disable-next-line: max-line-length
//                 isPublication ? TaJsonDeserialize<OPDSPublication>(responseJson, OPDSPublication) : // "application/opds-publication+json"
//                 // tslint:disable-next-line: max-line-length
//                 (isAuth ? TaJsonDeserialize<OPDSAuthenticationDoc>(responseJson, OPDSAuthenticationDoc) : // "application/vnd.opds.authentication.v1.0+json"
//                 TaJsonDeserialize<OPDSFeed>(responseJson, OPDSFeed)); // "application/opds+json"

//             const opds2FeedJson = TaJsonSerialize(opds2Feed);

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
//                 if (isAuth) {
//                     jsonSchemasNames.unshift("opds/authentication"); // must be first!
//                 } else if (!isPublication) {
//                     jsonSchemasNames.unshift("opds/feed"); // must be first!
//                 }
//                 // debug(jsonSchemasNames);

//                 const validationErrors =
//                     jsonSchemaValidate(jsonSchemasRootpath, jsonSchemasNames, opds2FeedJson);
//                 if (validationErrors) {
//                     validationStr = "";

//                     for (const err of validationErrors) {

//                         debug("JSON Schema validation FAIL.");
//                         debug(err);

//                         if (isPublication) {
//                             const val = err.jsonPath ? DotProp.get(opds2FeedJson, err.jsonPath) : "";
//                             const valueStr = (typeof val === "string") ?
//                                 `${val}` :
//                                 ((val instanceof Array || typeof val === "object") ?
//                                 `${JSON.stringify(val)}` :
//                                     "");
//                             debug(valueStr);

//                             const title = DotProp.get(opds2FeedJson, "metadata.title");
//                             debug(title);

//                             validationStr +=
//                             // tslint:disable-next-line:max-line-length
//                             `\n"${title}"\n\n${err.ajvMessage}: ${valueStr}\n\n'${err.ajvDataPath?.replace(/^\./, "")}' (${err.ajvSchemaPath})\n\n`;
//                         } else {
//                             const val = err.jsonPath ? DotProp.get(opds2FeedJson, err.jsonPath) : "";
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
//                                 title = DotProp.get(opds2FeedJson, jsonPubTitlePath);
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

//                     if ((obj.type && obj.type.indexOf("opds") >= 0 && obj.type.indexOf("json") >= 0) ||
//                         (obj.Type && obj.Type.indexOf("opds") >= 0 && obj.Type.indexOf("json") >= 0)) {

//                         obj.__href__ = rootUrl + req.originalUrl.substr(0,
//                             req.originalUrl.indexOf(serverOPDS_browse_v2_PATH + "/")) +
//                             serverOPDS_browse_v2_PATH + "/" + encodeURIComponent_RFC3986(fullHref);

//                         if (authRequestBase64 && authResponseBase64) {
//                             obj.__href__AUTH = obj.__href__ +
//                             "?" +
//                             _authResponse + "=" + encodeURIComponent_RFC3986(authResponseBase64) +
//                             "&" +
//                             _authRequest + "=" + encodeURIComponent_RFC3986(authRequestBase64)
//                             ;
//                         }
//                     } else if (obj.type === "application/vnd.readium.lcp.license.v1.0+json"
//                         // && obj.rel === "http://opds-spec.org/acquisition"
//                         ) {

//                         obj.__href__ = rootUrl + req.originalUrl.substr(0,
//                             req.originalUrl.indexOf(serverOPDS_browse_v2_PATH + "/")) +
//                             serverLCPLSD_show_PATH + "/" + encodeURIComponent_RFC3986(fullHref);

//                         if (authRequestBase64 && authResponseBase64) {
//                             obj.__href__AUTH = obj.__href__ +
//                             "?" +
//                             _authResponse + "=" + encodeURIComponent_RFC3986(authResponseBase64) +
//                             "&" +
//                             _authRequest + "=" + encodeURIComponent_RFC3986(authRequestBase64)
//                             ;
//                         }
//                     } else if ((obj.type && obj.type.indexOf("application/atom+xml") >= 0) ||
//                         (obj.Type && obj.Type.indexOf("application/atom+xml") >= 0)) {

//                         obj.__href__ = rootUrl + req.originalUrl.substr(0,
//                             req.originalUrl.indexOf(serverOPDS_browse_v2_PATH + "/")) +
//                             serverOPDS_convert_v1_to_v2_PATH + "/" + encodeURIComponent_RFC3986(fullHref);

//                     } else if (isDataUrl) {
//                         // obj.href = obj.href.substr(0, 100) + "(...)";
//                         // obj.__href__ = rootUrl + req.originalUrl.substr(0,
//                         //     req.originalUrl.indexOf(serverOPDS_browse_v2_PATH + "/")) +
//                         //     serverOPDS_dataUrl_PATH + "/" + encodeURIComponent_RFC3986(fullHref);

//                     } else if (notFull && !isMailUrl) {
//                         obj.__href__ = fullHref;
//                     }
//                 }
//             };
//             traverseJsonObjects(opds2FeedJson, funk);

//             const css = css2json(jsonStyle);
//             let jsonPrettyOPDS2 = jsonMarkup(opds2FeedJson, css);
//             // tslint:disable-next-line: max-line-length
//             jsonPrettyOPDS2 = jsonPrettyOPDS2.replace(/>"data:image\/(.*)"</g, "><a href=\"data:image/$1\" target=\"_BLANK\"><img style=\"max-width: 100px;\" src=\"data:image/$1\"></a><");

//             const authDoc = isAuth ? opds2Feed as OPDSAuthenticationDoc : undefined;
//             const authObj = (authDoc && authDoc.Authentication) ? authDoc.Authentication.find((auth) => {
//                 return auth.Type === "http://opds-spec.org/auth/oauth/password";
//             }) : undefined;
//             const authLink = authObj ? (authObj.Links && authObj.Links.find((link) => {
//                 return link.Rel && link.Rel.includes("authenticate") && link.TypeLink === "application/json";
//             })) : undefined;
//             // const authLinkRefresh = authObj ? (authObj.Links && authObj.Links.find((link) => {
//             //     return link.Rel.includes("refresh") && link.TypeLink === "application/json";
//             // })) : undefined;

//             const imageLink = authDoc ? (authDoc.Links && authDoc.Links.find((link) => {
//                 return link.Rel && link.Rel.includes("logo") && link.TypeLink && link.TypeLink.startsWith("image/");
//             })) : undefined;
//             const imageUrl = imageLink ? ensureAbsolute(urlDecoded, imageLink.Href) : undefined;

//             const authHtmlForm = !authObj ? "" : `
// <hr>
// <form id="authForm">
//     <input type="text" name="login" id="login" size="40">
//     <span>${authObj.Labels.Login}</span>
// <br><br>
//     <input type="password" name="password" id="password" size="40">
//     <span>${authObj.Labels.Password}</span>
// <br><br>
//     <input type="submit" value="Authenticate">
// </form>
// ${imageUrl ? `<img src="${imageUrl}" />` : ""}
// <script type="text/javascript">
// // document.addEventListener("DOMContentLoaded", (event) => {
// // });
// const formElement = document.getElementById("authForm");
// formElement.addEventListener("submit", (event) => {
//     event.preventDefault();
//     doAuth();
// });
// function encodeURIComponent_RFC3986(str) {
//     return encodeURIComponent(str).replace(/[!'()*]/g, (c) => {
//         return "%" + c.charCodeAt(0).toString(16);
//     });
// }
// function encodeFormData(json) {
//     if (!json) {
//         return "";
//     }
//     return Object.keys(json).map((key) => {
//         return encodeURIComponent_RFC3986(key) + "=" + (json[key] ? encodeURIComponent_RFC3986(json[key]) : "_");
//     }).join("&");
// }
// function hexStrToArrayBuffer(hexStr) {
//     return new Uint8Array(
//         hexStr
//         .match(/.{1,2}/g)
//         .map((byte) => {
//             return parseInt(byte, 16);
//         })
//     );
// }
// function doAuth() {
//     ${authLink ? `
//     const bodyJson = {
//         targetUrl: "${urlDecoded}",
//         authUrl: "${authLink.Href}",
//         grant_type: "password",
//         username: document.getElementById("login").value,
//         password: document.getElementById("password").value
//     };
//     const bodyStr = JSON.stringify(bodyJson);

//     const textEncoder = new TextEncoder("utf-8");
//     const bodyStrEncoded = textEncoder.encode(bodyStr); // Uint8Array

//     const keyPromise = window.crypto.subtle.importKey(
//         "raw",
//         hexStrToArrayBuffer("${OPDS_AUTH_ENCRYPTION_KEY_HEX}"),
//         { "name": "AES-CBC" },
//         false,
//         ["encrypt", "decrypt"]
//     );
//     keyPromise.then((key) => { // CryptoKey

//         const iv = hexStrToArrayBuffer("${OPDS_AUTH_ENCRYPTION_IV_HEX}");
//         const encryptedBodyPromise = window.crypto.subtle.encrypt(
//             {
//                 name: "AES-CBC",
//                 iv
//             },
//             key,
//             bodyStrEncoded
//         );
//         encryptedBodyPromise.then((encryptedBody) => { // ArrayBuffer
//             // const arg = String.fromCharCode.apply(null, new Uint8Array(encryptedBody));
//             const arg = new Uint8Array(encryptedBody).reduce((data, byte) => {
//                 return data + String.fromCharCode(byte);
//             }, '');
//             const encryptedBodyB64 = window.btoa(arg);

//             const url = location.origin + "${serverOPDS_auth_PATH}/" + encodeURIComponent_RFC3986(encryptedBodyB64);
//             location.href = url;
//         }).catch((err) => {
//             console.log(err);
//         });
//     }).catch((err) => {
//         console.log(err);
//     });

// /* does not work because of HTTP CORS, so we forward to NodeJS fetch/request via the serverOPDS_auth_PATH HTTP route
//     window.fetch("${authLink.Href}", {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/x-www-form-url-encoded",
//             "Accept": "application/json"
//         },
//         body: encodeFormData(bodyJson)
//     })
//     .then((response) => {
//         const res = JSON.stringify(response, null, 4);
//         console.log(res);
//     })
//     .catch((error) => {
//         console.log(error);
//     });
// */
//     ` :
//     "window.alert(\"no auth link!\");"
//     }
// }
// </script>`;

//             res.status(200).send("<html><body>" +
//                 "<h1>OPDS2 JSON " +
//                 (isPublication ? "entry" : (isAuth ? "authentication" : "feed")) +
//                 " (OPDS2) " + (isAuthStatusCode ? " [HTTP 401]" : "") + "</h1>" +
//                 "<h2><a href=\"" + urlDecoded + "\">" + urlDecoded + "</a></h2>" +
//                 "<hr>" +
//                 "<div style=\"overflow-x: auto;margin:0;padding:0;width:100%;height:auto;\">" +
//                 jsonPrettyOPDS2 + "</div>" +
//                 // tslint:disable-next-line:max-line-length
//                 (doValidate ? (validationStr ? ("<hr><p><pre>" + validationStr + "</pre></p>") : ("<hr><p>JSON SCHEMA OK.</p>")) : "") +
//                 authHtmlForm +
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

//         if (authResponseJson && authResponseJson.access_token) {
//             // eslint-disable-next-line @typescript-eslint/no-explicit-any
//             (headers as any).Authorization = `Bearer ${authResponseJson.access_token}`;
//         }

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

//     topRouter.use(serverOPDS_browse_v2_PATH, routerOPDS_browse_v2);

//     // -------------------------------------------------------

//     // // tslint:disable-next-line:variable-name
//     // const routerOPDS_dataUrl = express.Router({ strict: false });
//     // routerOPDS_dataUrl.use(morgan("combined", { stream: { write: (msg: any) => debug(msg) } }));

//     // routerOPDS_dataUrl.use(trailingSlashRedirect);

//     // routerOPDS_dataUrl.get("/", (_req: express.Request, res: express.Response) => {

//     //     let html = "<html><head>";
//     //     html += `<script type="text/javascript">function encodeURIComponent_RFC3986(str) { ` +
//     //         `return encodeURIComponent(str).replace(/[!'()*]/g, (c) => { ` +
//     //         `return "%" + c.charCodeAt(0).toString(16); }); }` +
//     //         `function go(evt) {` +
//     //         `if (evt) { evt.preventDefault(); } var url = ` +
//     //         `location.origin +` +
//     //         // `location.protocol + '//' + location.hostname + ` +
//     //         // `(location.port ? (':' + location.port) : '') + ` +
//     //         ` '${serverOPDS_dataUrl_PATH}/' +` +
//     //         ` encodeURIComponent_RFC3986(document.getElementById("url").value);` +
//     //         `location.href = url;}</script>`;
//     //     html += "</head>";

//     //     html += "<body><h1>data URL viewer</h1>";

//     //     html += `<form onsubmit="go();return false;">` +
//     //         `<input type="text" name="url" id="url" size="80">` +
//     //         `<input type="submit" value="Go!"></form>`;

//     //     html += "</body></html>";

//     //     res.status(200).send(html);
//     // });

//     // routerOPDS_dataUrl.param("urlEncoded", (req, _res, next, value, _name) => {
//     // // Express 4 -> 5 wildcard (new router / path-to-regexp parser)
//     // if (typeof value !== "string") {
//     //     if (Array.isArray(value)) {
//     //         value = value.join("/");
//     //     }
//     // }
//     //     (req as IRequestPayloadExtension).urlEncoded = value;
//     //     next();
//     // });

//     // routerOPDS_dataUrl.get("/:" + _urlEncoded + "(*)", async (req: express.Request, res: express.Response) => {

//     //     const reqparams = (req as IRequestPayloadExtension).params;

//     //     if (!reqparams.urlEncoded) {
//     //         reqparams.urlEncoded = (req as IRequestPayloadExtension).urlEncoded;
//     //     }
//     // if (reqparams.urlEncoded && typeof reqparams.urlEncoded !== "string") {
//     //     if (Array.isArray(reqparams.urlEncoded)) {
//     //         reqparams.urlEncoded = (reqparams.urlEncoded as []).join("/");
//     //     }
//     // }

//     //     const urlDecoded = reqparams.urlEncoded;
//     //     // if (urlDecoded.substr(-1) === "/") {
//     //     //     urlDecoded = urlDecoded.substr(0, urlDecoded.length - 1);
//     //     // }
//     //     debug(urlDecoded);

//     //     res.status(200).send("<html><body>" +
//     //         "<h1>DATA URL</h1>" +
//     //         "<h2><a href=\"" + urlDecoded + "\">" + urlDecoded + "</a></h2>" +
//     //         "<hr>" +
//     //         "<img src=\"" + urlDecoded + "\" />" +
//     //         "</body></html>");
//     // });

//     // topRouter.use(serverOPDS_dataUrl_PATH, routerOPDS_dataUrl);

//     // -------------------------------------------------------

//     // tslint:disable-next-line:variable-name
//     const routerOPDS_auth = express.Router({ strict: false });
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     routerOPDS_auth.use(morgan("combined", { stream: { write: (msg: any) => debug(msg) } }));

//     routerOPDS_auth.use(trailingSlashRedirect);

//     routerOPDS_auth.get("/", (_req: express.Request, res: express.Response) => {

//         const html = "<html><body><h1>NOPE</h1></body></html>";
//         res.status(200).send(html);
//     });

//     routerOPDS_auth.param("urlEncoded", (req, _res, next, value, _name) => {
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
//     // routerOPDS_auth.get(new RegExp(regexpEscape("/:" + _urlEncoded) + "(.*)"), async (req: express.Request, res: express.Response) => {
//     routerOPDS_auth.get("/*" + _urlEncoded, async (req: express.Request, res: express.Response) => {
//     // Express 4 -> 5 wildcard (new router / path-to-regexp parser)
//     // routerOPDS_auth.get("/:" + _urlEncoded + "(*)", async (req: express.Request, res: express.Response) => {

//         const reqparams = (req as IRequestPayloadExtension).params;

//         if (!reqparams.urlEncoded) {
//             reqparams.urlEncoded = (req as IRequestPayloadExtension).urlEncoded;
//         }
//         if (reqparams.urlEncoded && typeof reqparams.urlEncoded !== "string") {
//             if (Array.isArray(reqparams.urlEncoded)) {
//                 reqparams.urlEncoded = (reqparams.urlEncoded as []).join("/");
//             }
//         }

//         const base64Payload = reqparams.urlEncoded;

//         const refreshToken = (req.query as IRequestQueryParams).authRefresh;

//         const isSecureHttp = req.secure ||
//             req.protocol === "https" ||
//             req.get("X-Forwarded-Proto") === "https"
//             ;
//         const rootUrl = (isSecureHttp ? "https://" : "http://")
//             + req.headers.host;

//         try {
//             const encrypted = Buffer.from(base64Payload, "base64"); // .toString("utf8");

//             const decrypteds: Buffer[] = [];
//             const decryptStream = crypto.createDecipheriv("aes-256-cbc",
//                 OPDS_AUTH_ENCRYPTION_KEY_BUFFER,
//                 OPDS_AUTH_ENCRYPTION_IV_BUFFER);
//             decryptStream.setAutoPadding(false);
//             const buff1 = decryptStream.update(encrypted);
//             if (buff1) {
//                 decrypteds.push(buff1);
//             }
//             const buff2 = decryptStream.final();
//             if (buff2) {
//                 decrypteds.push(buff2);
//             }
//             const decrypted = Buffer.concat(decrypteds);
//             const nPaddingBytes = decrypted[decrypted.length - 1];
//             const size = encrypted.length - nPaddingBytes;
//             const decryptedStr = decrypted.slice(0, size).toString("utf8");
//             const decryptedJson = JSON.parse(decryptedStr);

//             const authUrl = decryptedJson.authUrl;
//             delete decryptedJson.authUrl;

//             const targetUrl = decryptedJson.targetUrl;
//             delete decryptedJson.targetUrl;

//             // https://www.oauth.com/oauth2-servers/making-authenticated-requests/refreshing-an-access-token/
//             if (refreshToken) {
//                 decryptedJson.grant_type = "refresh_token";
//                 decryptedJson.refresh_token = refreshToken;
//             }

//             // const grantType = decryptedJson.grant_type;
//             // const username = decryptedJson.username;
//             // const password = decryptedJson.password;

//             // function encodeFormData(json: any) {
//             //     return Object.keys(json).map((key) => {
//             //         return encodeURIComponent_RFC3986(key) +
//             //             "=" + (json[key] ? encodeURIComponent_RFC3986(json[key]) : "_");
//             //     }).join("&");
//             // }
//             // const encodedFormData = encodeFormData(decryptedJson);

//             // eslint-disable-next-line @typescript-eslint/no-explicit-any
//             const failure = (err: any) => {
//                 debug(err);
//                 res.status(500).send("<html><body><p>Internal Server Error</p><p>"
//                     + err + "</p></body></html>");
//             };

//             const success = async (response: request.RequestResponse) => {

//                 // Object.keys(response.headers).forEach((header: string) => {
//                 //     debug(header + " => " + response.headers[header]);
//                 // });

//                 if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
//                     failure("HTTP CODE " + response.statusCode);
//                     return;
//                 }

//                 let responseData: Buffer;
//                 try {
//                     responseData = await streamToBufferPromise(response);
//                 } catch (err) {
//                     debug(err);
//                     res.status(500).send("<html><body><p>Internal Server Error</p><p>"
//                         + err + "</p></body></html>");
//                     return;
//                 }
//                 try {
//                     const responseStr = responseData.toString("utf8");
//                     const responseJson = JSON.parse(responseStr);
//                     // {
//                     //     "access_token": "XXX",
//                     //     "token_type": "Bearer",
//                     //     "expires_in": 3600,
//                     //     "refresh_token": "YYYY",
//                     //     "created_at": 1574940691
//                     // }
//                     const targetUrl_ = rootUrl + req.originalUrl.substr(0,
//                         req.originalUrl.indexOf(serverOPDS_auth_PATH + "/")) +
//                         serverOPDS_browse_v2_PATH + "/" + encodeURIComponent_RFC3986(targetUrl) +
//                         "?" + _authResponse + "=" +
//                         encodeURIComponent_RFC3986(Buffer.from(JSON.stringify(responseJson)).toString("base64")) +
//                         "&" + _authRequest + "=" + encodeURIComponent_RFC3986(base64Payload);

//                     const refreshTokenUrl = responseJson.refresh_token ? rootUrl + req.originalUrl.substr(0,
//                         req.originalUrl.indexOf(serverOPDS_auth_PATH + "/")) +
//                         serverOPDS_auth_PATH + "/" + encodeURIComponent_RFC3986(base64Payload) +
//                         "?" + _authRefresh + "=" + encodeURIComponent_RFC3986(responseJson.refresh_token) : undefined;

//                     decryptedJson.password = "***";
//                     res.status(200).send(`
//                         <html><body>
//                         <hr>
//                         <a href="${targetUrl_}">${targetUrl}</a>
//                         <hr>
//                         <pre>${JSON.stringify(decryptedJson, null, 4)}</pre>
//                         <hr>
//                         <pre>${JSON.stringify(responseJson, null, 4)}</pre>
//                         <hr>
//                         ${refreshTokenUrl ? `<a href="${refreshTokenUrl}">FORCE REFRESH TOKEN</a>` : ""}
//                         <hr>
//                         </body></html>
//                     `);
//                 } catch (err) {
//                     debug(err);
//                     res.status(500).send("<html><body><p>Internal Server Error</p><p>"
//                         + err + "</p></body></html>");
//                     return;
//                 }
//             };

//             const headers = {
//                 "Accept": "application/json,application/xml",
//                 "Accept-Language": "en-UK,en-US;q=0.7,en;q=0.5",
//                 "Content-Type": "application/x-www-form-url-encoded",
//                 "User-Agent": "READIUM2",
//             };

//             // // No response streaming! :(
//             // // https://github.com/request/request-promise/issues/90
//             // const needsStreamingResponse = true;
//             // if (needsStreamingResponse) {
//                 request.post({
//                     form: decryptedJson,
//                     headers,
//                     method: "POST",
//                     uri: authUrl,
//                 })
//                     .on("response", async (res) => {
//                         try {
//                             await success(res);
//                         }
//                         catch (successError) {
//                             failure(successError);
//                             return;
//                         }
//                     })
//                     .on("error", failure);
//             // } else {
//             //     let response: requestPromise.FullResponse;
//             //     try {
//             //         // tslint:disable-next-line:await-promise no-floating-promises
//             //         response = await requestPromise({
//             //             form: decryptedJson,
//             //             headers,
//             //             method: "POST",
//             //             resolveWithFullResponse: true,
//             //             uri: authUrl,
//             //         });
//             //     } catch (err) {
//             //         failure(err);
//             //         return;
//             //     }

//             //     await success(response);
//             // }
//         } catch (err) {
//             debug(err);

//             res.status(500).send("<html><body><p>Internal Server Error</p><p>"
//             + "--" + "</p></body></html>");
//         }
//     });

//     topRouter.use(serverOPDS_auth_PATH, routerOPDS_auth);
// }
