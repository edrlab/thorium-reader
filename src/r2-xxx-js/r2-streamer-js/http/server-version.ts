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
// import * as fs from "fs";
// import * as jsonMarkup from "json-markup";
// import * as path from "path";

// import {
//     IRequestPayloadExtension, IRequestQueryParams, _jsonPath, _show,
// } from "./request-ext";
// import { Server } from "./server";

// const debug = debug_("r2:streamer#http/server-version");

// // https://github.com/mafintosh/json-markup/blob/master/style.css
// const jsonStyle = `
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

// // tslint:disable-next-line:variable-name
// export const serverVersion_PATH = "/version";
// export function serverVersion(server: Server, topRouter: express.Application) {

//     topRouter.get([serverVersion_PATH, serverVersion_PATH + "/" + _show + "{/:" + _jsonPath + "}"],
//     (req: express.Request, res: express.Response) => {

//         const reqparams = (req as IRequestPayloadExtension).params;

//         const isShow = req.url.indexOf("/show") >= 0 || (req.query as IRequestQueryParams).show;
//         if (!reqparams.jsonPath && (req.query as IRequestQueryParams).show) {
//             reqparams.jsonPath = (req.query as IRequestQueryParams).show;
//         }

//         const gitRevJson = "../../../gitrev.json";
//         if (!fs.existsSync(path.resolve(path.join(__dirname, gitRevJson)))) {

//             const err = "Missing Git rev JSON! ";
//             debug(err + gitRevJson);
//             res.status(500).send("<html><body><p>Internal Server Error</p><p>"
//                 + err + "</p></body></html>");
//             return;
//         }

//         // eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-require-imports
//         const jsonObj = require(gitRevJson);
//         // debug(jsonObj);

//         if (isShow) {
//             const jsonPretty = jsonMarkup(jsonObj, css2json(jsonStyle));

//             res.status(200).send("<html><body>" +
//                 "<h1>R2-STREAMER-JS VERSION INFO</h1>" +
//                 "<hr><p><pre>" + jsonPretty + "</pre></p>" +
//                 // "<hr><p><pre>" + jsonStr + "</pre></p>" +
//                 // "<p><pre>" + dumpStr + "</pre></p>" +
//                 "</body></html>");
//         } else {
//             server.setResponseCORS(res);
//             res.set("Content-Type", "application/json; charset=utf-8");

//             const jsonStr = JSON.stringify(jsonObj, null, "  ");

//             const checkSum = crypto.createHash("sha256");
//             checkSum.update(jsonStr);
//             const hash = checkSum.digest("hex");

//             const match = req.header("If-None-Match");
//             if (match === hash) {
//                 debug("publications.json cache");
//                 res.status(304); // StatusNotModified
//                 res.end();
//                 return;
//             }

//             res.setHeader("ETag", hash);
//             // server.setResponseCacheHeaders(res, true);

//             res.status(200).send(jsonStr);
//         }
//     });
// }
