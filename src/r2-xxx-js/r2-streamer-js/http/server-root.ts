// // ==LICENSE-BEGIN==
// // Copyright 2017 European Digital Reading Lab. All rights reserved.
// // Licensed to the Readium Foundation under one or more contributor license agreements.
// // Use of this source code is governed by a BSD-style license
// // that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// // ==LICENSE-END==

// import * as express from "express";
// import { html as beautifyHtml } from "js-beautify";
// import * as path from "path";

// import { encodeURIComponent_RFC3986, isHTTP } from "@r2-utils-js/_utils/http/UrlUtils";

// import { _show } from "./request-ext";
// import { Server } from "./server";
// import { serverLCPLSD_show_PATH } from "./server-lcp-lsd-show";
// import { serverOPDS_browse_v1_PATH } from "./server-opds-browse-v1";
// import { serverOPDS_browse_v2_PATH } from "./server-opds-browse-v2";
// import { serverOPDS_convert_v1_to_v2_PATH } from "./server-opds-convert-v1-to-v2";
// import { serverOPDS_local_feed_PATH } from "./server-opds-local-feed";
// import { serverPub_PATH } from "./server-pub";
// import { serverRemotePub_PATH } from "./server-url";
// import { serverVersion_PATH } from "./server-version";

// // import debug_ from "debug";
// // const debug = debug_("r2:streamer#http/server-root");

// // const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");

// export function serverRoot(server: Server, topRouter: express.Application) {

//     topRouter.options(/(.*)/, (_req: express.Request, res: express.Response) => {
//     // Express 4 -> 5 wildcard (new router / path-to-regexp parser)
//     // topRouter.options("*", (_req: express.Request, res: express.Response) => {

//         // console.log(req.url);

//         // Object.keys(req.headers).forEach((header: string) => {
//         //     console.log(header + " => " + req.headers[header]);
//         // });

//         server.setResponseCORS(res);

//         const serverData = server.serverInfo();
//         if (serverData && serverData.trustKey &&
//             serverData.trustCheck && serverData.trustCheckIV) {

//             res.setHeader("Access-Control-Allow-Headers",
//                 (res.getHeader("Access-Control-Allow-Headers") as string).toString() +
//                 ", X-" + serverData.trustCheck); // access-control-request-headers
//         }

//         // Object.keys(res.getHeaders()).forEach((header: string) => {
//         //     console.log(header + " => " + res.getHeaders()[header]);
//         // });

//         res.status(200).end();
//     });

//     topRouter.get("/", (_req: express.Request, res: express.Response) => {

//         const html =
//             `\
// <!DOCTYPE html>
// <html>
// <body>
// <h1>Local Publications</h1>
// ${server.getPublications().map((pub) => {
//                 const filePathBase64 = Buffer.from(pub).toString("base64");
//                 return `\
// <h2><a href=".${serverPub_PATH}/${encodeURIComponent_RFC3986(filePathBase64)}">\
// ${isHTTP(pub) ? pub : path.basename(pub)}\
// </a></h2>
// `;
//             }).join("")}\
// ${server.disableOPDS ? "" : `\
// <p>
// <a href='.${serverOPDS_local_feed_PATH}'>See OPDS2 Feed</a> (JSON)
// </p>
// `}\
// <h1>Additional Services</h1>

// <h2><a href='.${serverVersion_PATH}/${_show}'>Display Server Version</a></h2>

// ${server.disableRemotePubUrl ? "" : `\
// <h2><a href='.${serverRemotePub_PATH}'>Load Remote Publication</a> (HTTP URL)</h2>
// <h2><a href='.${serverLCPLSD_show_PATH}'>Show LCP / LSD</a> (HTTP URL)</h2>
// `}\

// ${server.disableOPDS ? "" : `\
// <h2><a href='.${serverOPDS_browse_v1_PATH}'>Browse OPDS1 (XML/Atom) feed</a> (HTTP URL)</h2>
// <h2><a href='.${serverOPDS_browse_v2_PATH}'>Browse OPDS2 (JSON) feed</a> (HTTP URL)</h2>
// <h2><a href='.${serverOPDS_convert_v1_to_v2_PATH}'>Convert OPDS v1 to v2</a> (HTTP URL)</h2>
// `}\

// </body>
// </html>
// `;

//         res.status(200).send(beautifyHtml(html));
//     });
// }
