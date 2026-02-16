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

// import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";

// import { IRequestPayloadExtension, _urlEncoded } from "./request-ext";
// import { Server } from "./server";
// import { trailingSlashRedirect } from "./server-trailing-slash-redirect";

// const debug = debug_("r2:streamer#http/server-url");

// // tslint:disable-next-line:variable-name
// export const serverRemotePub_PATH = "/url";
// export function serverRemotePub(_server: Server, topRouter: express.Application) {

//     const routerUrl = express.Router({ strict: false });

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     routerUrl.use(morgan("combined", { stream: { write: (msg: any) => debug(msg) } }));

//     routerUrl.use(trailingSlashRedirect);

//     routerUrl.get("/", (_req: express.Request, res: express.Response) => {

//         let html = "<html><head>";
//         html += "<script type=\"text/javascript\">function encodeURIComponent_RFC3986(str) { " +
//             "return encodeURIComponent(str).replace(/[!'()*]/g, (c) => { " +
//             "return \"%\" + c.charCodeAt(0).toString(16); }); }" +
//             "function go(evt) {" +
//             "if (evt) { evt.preventDefault(); } var url = " +
//             "location.origin +" +
//             // `location.protocol + '//' + location.hostname + ` +
//             // `(location.port ? (':' + location.port) : '') + ` +
//             ` '${serverRemotePub_PATH}/' +` +
//             " encodeURIComponent_RFC3986(document.getElementById(\"url\").value);" +
//             "location.href = url;}</script>";
//         html += "</head>";

//         html += "<body><h1>Publication URL</h1>";

//         html += "<form onsubmit=\"go();return false;\">" +
//             "<input type=\"text\" name=\"url\" id=\"url\" size=\"80\">" +
//             "<input type=\"submit\" value=\"Go!\"></form>";

//         html += "</body></html>";

//         res.status(200).send(html);
//     });

//     routerUrl.param("urlEncoded", (req, _res, next, value, _name) => {
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
//     // routerUrl.get(new RegExp(regexpEscape("/:" + _urlEncoded) + "(.*)"), (req: express.Request, res: express.Response) => {
//     routerUrl.get("/*" + _urlEncoded, (req: express.Request, res: express.Response) => {
//     // Express 4 -> 5 wildcard (new router / path-to-regexp parser)
//     // routerUrl.get("/:" + _urlEncoded + "(*)", (req: express.Request, res: express.Response) => {

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

//         const urlDecodedBase64 = encodeURIComponent_RFC3986(Buffer.from(urlDecoded).toString("base64"));
//         const redirect = req.originalUrl.substr(0,
//             req.originalUrl.indexOf(serverRemotePub_PATH + "/"))
//             + "/pub/" + urlDecodedBase64 + "/";

//         // No need for CORS with this URL redirect (HTML page lists available services)
//         // server.setResponseCORS(res);

//         debug(`REDIRECT: ${req.originalUrl} ==> ${redirect}`);
//         res.redirect(301, redirect);
//     });

//     topRouter.use(serverRemotePub_PATH, routerUrl);
// }
