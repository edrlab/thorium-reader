// // ==LICENSE-BEGIN==
// // Copyright 2017 European Digital Reading Lab. All rights reserved.
// // Licensed to the Readium Foundation under one or more contributor license agreements.
// // Use of this source code is governed by a BSD-style license
// // that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// // ==LICENSE-END==

// // import * as regexpEscape from "regexp.escape";

// import debug_ from "debug";
// import * as express from "express";
// import * as mime from "mime-types";
// import * as path from "path";

// import { zipHasEntry } from "@r2-shared-js/_utils/zipHasEntry";
// import { Publication } from "@r2-shared-js/models/publication";
// import { Link } from "@r2-shared-js/models/publication-link";
// import { Transformers } from "@r2-shared-js/transform/transformer";
// import { parseRangeHeader } from "@r2-utils-js/_utils/http/RangeUtils";
// import { streamToBufferPromise } from "@r2-utils-js/_utils/stream/BufferUtils";
// import { IStreamAndLength, IZip } from "@r2-utils-js/_utils/zip/zip";
// import { URL_SIGNED_EXPIRY_QUERY_PARAM_NAME, verifyExpiringResourceURL } from "./url-signed-expiry";

// import {
//     IRequestPayloadExtension, IRequestQueryParams, URL_PARAM_SESSION_INFO, _asset, _pathBase64,
// } from "./request-ext";
// import { Server } from "./server";

// // import { CounterPassThroughStream } from "@r2-utils-js/_utils/stream/CounterPassThroughStream";
// // import { PassThrough } from "stream";

// const debug = debug_("r2:streamer#http/server-assets");

// export function serverAssets(server: Server, routerPathBase64: express.Router) {

//     // let streamCounter = 0;

//     const routerAssets = express.Router({ strict: false });
//     // routerAssets.use(morgan("combined"), { stream: { write: (msg: any) => debug(msg) } }));

//     routerAssets.get("/",
//         async (req: express.Request, res: express.Response) => {

//             const reqparams = (req as IRequestPayloadExtension).params;

//             if (!reqparams.pathBase64) {
//                 reqparams.pathBase64 = (req as IRequestPayloadExtension).pathBase64;
//             }
//             if (!reqparams.asset) {
//                 reqparams.asset = (req as IRequestPayloadExtension).asset;
//             }
//             if (reqparams.asset && typeof reqparams.asset !== "string") {
//                 if (Array.isArray(reqparams.asset)) {
//                     reqparams.asset = (reqparams.asset as []).join("/");
//                 }
//             }

//             if (!reqparams.lcpPass64) {
//                 reqparams.lcpPass64 = (req as IRequestPayloadExtension).lcpPass64;
//             }

//             const isShow = (req.query as IRequestQueryParams).show;

//             // debug(req.method);
//             const isHead = req.method.toLowerCase() === "head";
//             if (isHead) {
//                 debug("HEAD !!!!!!!!!!!!!!!!!!!");
//             }

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

//             const zipInternal = publication.findFromInternal("zip");
//             if (!zipInternal) {
//                 const err = "No publication zip!";
//                 debug(err);
//                 res.status(500).send("<html><body><p>Internal Server Error</p><p>"
//                     + err + "</p></body></html>");
//                 return;
//             }
//             const zip = zipInternal.Value as IZip;

//             const pathInZip = reqparams.asset;

//             if (!zipHasEntry(zip, pathInZip, undefined)) {
//                 const err = "Asset not in zip! " + pathInZip;
//                 debug(err);
//                 res.status(500).send("<html><body><p>Internal Server Error</p><p>"
//                     + err + "</p></body></html>");
//                 return;
//             }

//             const isDivina = publication.Metadata && publication.Metadata.RDFType &&
//                 (/https?:\/\/schema\.org\/ComicStory$/.test(publication.Metadata.RDFType) ||
//                 /https?:\/\/schema\.org\/VisualNarrative$/.test(publication.Metadata.RDFType));

//             let link: Link | undefined;

//             const findLinkRecursive = (relativePath: string, l: Link): Link | undefined => {
//                 if (l.Href === relativePath) {
//                     return l;
//                 }
//                 let found: Link | undefined;
//                 if (l.Children) {
//                     for (const child of l.Children) {
//                         found = findLinkRecursive(relativePath, child);
//                         if (found) {
//                             return found;
//                         }
//                     }
//                 }
//                 if (l.Alternate) {
//                     for (const alt of l.Alternate) {
//                         found = findLinkRecursive(relativePath, alt);
//                         if (found) {
//                             return found;
//                         }
//                     }
//                 }
//                 return undefined;
//             };

//             if ((publication.Resources || publication.Spine || publication.Links)
//                 && pathInZip.indexOf("META-INF/") !== 0
//                 && !/\.opf$/i.test(pathInZip)) {

//                 const relativePath = pathInZip;

//                 if (publication.Resources) {
//                     for (const l of publication.Resources) {
//                         link = findLinkRecursive(relativePath, l);
//                         if (link) {
//                             break;
//                         }
//                     }
//                 }
//                 if (!link) {
//                     if (publication.Spine) {
//                         for (const l of publication.Spine) {
//                             link = findLinkRecursive(relativePath, l);
//                             if (link) {
//                                 break;
//                             }
//                         }
//                     }
//                 }
//                 if (!link) {
//                     if (publication.Links) {
//                         for (const l of publication.Links) {
//                             link = findLinkRecursive(relativePath, l);
//                             if (link) {
//                                 break;
//                             }
//                         }
//                     }
//                 }
//                 if (!link &&
//                     !isDivina) {
//                     const err = "Asset not declared in publication spine/resources! " + relativePath;
//                     debug(err);
//                     res.status(500).send("<html><body><p>Internal Server Error</p><p>"
//                         + err + "</p></body></html>");
//                     return;
//                 }
//             }

//             if (server.isSecured() && !link &&
//                 (pathInZip.indexOf("META-INF/") === 0 || /\.opf$/i.test(pathInZip))
//             ) {
//                 res.status(200).send("<html><body></body></html>");
//                 return;
//             }

//             if (server.enableSignedExpiry) {
//                 const ok = verifyExpiringResourceURL((req.query as IRequestQueryParams)[URL_SIGNED_EXPIRY_QUERY_PARAM_NAME], pathBase64Str, pathInZip);
//                 if (!ok) {
//                     const err = "Asset expired?! " + pathInZip;
//                     debug(err);
//                     res.status(401).send("<html><body><p>Internal Server Error</p><p>"
//                         + err + "</p></body></html>");
//                     return;
//                 }
//             }

//             let mediaType = mime.lookup(pathInZip);
//             if (link && link.TypeLink) {
//                 mediaType = link.TypeLink;
//             }

//             const isText = (typeof mediaType === "string") && (
//                 mediaType.indexOf("text/") === 0 ||
//                 mediaType.indexOf("application/xhtml") === 0 ||
//                 mediaType.indexOf("application/xml") === 0 ||
//                 mediaType.indexOf("application/json") === 0 ||
//                 mediaType.indexOf("application/svg") === 0 ||
//                 mediaType.indexOf("application/smil") === 0 ||
//                 mediaType.indexOf("+json") > 0 ||
//                 mediaType.indexOf("+smil") > 0 ||
//                 mediaType.indexOf("+svg") > 0 ||
//                 mediaType.indexOf("+xhtml") > 0 ||
//                 mediaType.indexOf("+xml") > 0);

//             // const isVideoAudio = mediaType && (
//             //     mediaType.indexOf("audio/") === 0 ||
//             //     mediaType.indexOf("video/") === 0);
//             // if (isVideoAudio) {
//             //     debug(req.headers);
//             // }

//             const isEncrypted = link && link.Properties && link.Properties.Encrypted;
//             // const isObfuscatedFont = isEncrypted && link &&
//             //     (link.Properties.Encrypted.Algorithm === "http://ns.adobe.com/pdf/enc#RC"
//             //         || link.Properties.Encrypted.Algorithm === "http://www.idpf.org/2008/embedding");

//             const isPartialByteRangeRequest = ((req.headers && req.headers.range) ? true : false);

//             // if (isEncrypted && isPartialByteRangeRequest) {
//             //     const err = "Encrypted video/audio not supported (HTTP 206 partial request byte range)";
//             //     debug(err);
//             //     res.status(500).send("<html><body><p>Internal Server Error</p><p>"
//             //         + err + "</p></body></html>");
//             //     return;
//             // }

//             let partialByteBegin = 0; // inclusive boundaries
//             let partialByteEnd = -1;
//             if (isPartialByteRangeRequest) {
//                 debug(req.headers.range);
//                 const ranges = parseRangeHeader(req.headers.range);
//                 // debug(ranges);

//                 if (ranges && ranges.length) {
//                     if (ranges.length > 1) {
//                         const err = "Too many HTTP ranges: " + req.headers.range;
//                         debug(err);
//                         // res.set("Content-Range", `*/${contentLength}`);
//                         res.status(416).send("<html><body><p>Internal Server Error</p><p>"
//                             + err + "</p></body></html>");
//                         return;
//                     }
//                     partialByteBegin = ranges[0].begin;
//                     partialByteEnd = ranges[0].end;

//                     if (partialByteBegin < 0) {
//                         partialByteBegin = 0;
//                     }
//                 }

//                 debug(`${pathInZip} >> ${partialByteBegin}-${partialByteEnd}`);
//             }
//             let zipStream_: IStreamAndLength;
//             try {
//                 zipStream_ = isPartialByteRangeRequest && !isEncrypted ?
//                     await zip.entryStreamRangePromise(pathInZip, partialByteBegin, partialByteEnd) :
//                     await zip.entryStreamPromise(pathInZip);
//             } catch (err) {
//                 debug(err);
//                 res.status(500).send("<html><body><p>Internal Server Error</p><p>"
//                     + err + "</p></body></html>");
//                 return;
//             }

//             // The HTML transforms are chained here too, so cannot check server.disableDecryption at this level!
//             const doTransform = true; // !isEncrypted || (isObfuscatedFont || !server.disableDecryption);

//             const sessionInfo = (req.query as IRequestQueryParams)[URL_PARAM_SESSION_INFO];

//             if (doTransform && link) {

//                 const fullUrl = `${server.serverUrl()}${req.originalUrl}`;

//                 // if (isEncrypted && (!publication.LCP || !publication.LCP.isReady())) {
//                 //     debug("WARNING: encrypted publication but LCP not initialised! ... will try using special RAW LCP transformer");
//                 // }

//                 let transformedStream: IStreamAndLength;
//                 try {
//                     transformedStream = await Transformers.tryStream(
//                         publication,
//                         link,
//                         fullUrl,
//                         zipStream_,
//                         isPartialByteRangeRequest,
//                         partialByteBegin,
//                         partialByteEnd,
//                         sessionInfo,
//                     );
//                 } catch (err) {
//                     debug(err);
//                     res.status(500).send("<html><body><p>Internal Server Error</p><p>"
//                         + err + "</p></body></html>");
//                     return;
//                 }
//                 if (transformedStream) {
//                     if (transformedStream !== zipStream_) {
//                         debug("Asset transformed ok: " + link.Href);
//                     }
//                     zipStream_ = transformedStream; // can be unchanged
//                 } else {
//                     const err = "Transform fail (encryption scheme not supported?)";
//                     debug(err);
//                     res.status(500).send("<html><body><p>Internal Server Error</p><p>"
//                         + err + "</p></body></html>");
//                     return;
//                 }
//             }

//             if (isShow) {
//                 let zipData: Buffer;
//                 try {
//                     zipData = await streamToBufferPromise(zipStream_.stream);
//                 } catch (err) {
//                     debug(err);
//                     res.status(500).send("<html><body><p>Internal Server Error</p><p>"
//                         + err + "</p></body></html>");
//                     return;
//                 }
//                 if (zipData) {
//                     debug("CHECK: " + zipStream_.length + " ==> " + zipData.length);
//                 }
//                 res.status(200).send("<html><body>" +
//                     "<h1>" + path.basename(pathBase64Str) + "</h1>" +
//                     "<h2>" + mediaType + "</h2>" +
//                     ((isText && zipData) ?
//                         ("<p><pre>" +
//                             zipData.toString("utf8").replace(/&/g, "&amp;")
//                                 .replace(/</g, "&lt;")
//                                 .replace(/>/g, "&gt;")
//                                 .replace(/"/g, "&quot;")
//                                 .replace(/'/g, "&apos;") +
//                             "</pre></p>")
//                         : "<p>BINARY</p>"
//                     ) + "</body></html>");

//                 return;
//             }

//             server.setResponseCORS(res);

//             if (isPartialByteRangeRequest || isEncrypted) {
//                 server.setResponseCacheHeaders(res, false);
//             } else {
//                 server.setResponseCacheHeaders(res, true);
//             }

//             if (mediaType) {
//                 res.set("Content-Type", mediaType);
//                 // res.type(mediaType);
//             }

//             res.setHeader("Accept-Ranges", "bytes");

//             if (isPartialByteRangeRequest) {
//                 if (partialByteEnd < 0) {
//                     partialByteEnd = zipStream_.length - 1;
//                 }
//                 const partialByteLength = isPartialByteRangeRequest ?
//                     partialByteEnd - partialByteBegin + 1 :
//                     zipStream_.length;
//                 // res.setHeader("Connection", "close");
//                 // res.setHeader("Transfer-Encoding", "chunked");
//                 res.setHeader("Content-Length", `${partialByteLength}`);
//                 const rangeHeader = `bytes ${partialByteBegin}-${partialByteEnd}/${zipStream_.length}`;
//                 // debug("+++> " + rangeHeader + " (( " + partialByteLength);
//                 res.setHeader("Content-Range", rangeHeader);
//                 res.status(206);
//             } else {
//                 res.setHeader("Content-Length", `${zipStream_.length}`);
//                 // debug("---> " + zipStream_.length);
//                 res.status(200);
//             }

//             if (isHead) {
//                 res.end();
//                 // } else if (!isPartialByteRangeRequest && zipStream_.length &&
//                 //     mediaType && mediaType.indexOf("html") >= 0) {

//                 //     debug("===> BUFFER SEND (bypass streaming)");
//                 //     let zipData: Buffer;
//                 //     try {
//                 //         zipData = await streamToBufferPromise(zipStream_.stream);
//                 //     } catch (err) {
//                 //         debug(err);
//                 //         res.status(500).send("<html><body><p>Internal Server Error</p><p>"
//                 //             + err + "</p></body></html>");
//                 //         return;
//                 //     }
//                 //     if (zipData) {
//                 //         debug("CHECK: " + zipStream_.length + " ==> " + zipData.length);
//                 //     }
//                 //     debug("HTMLHTMLHTMLHTMLHTMLHTMLHTML");
//                 //     debug(zipData.toString("utf8"));
//                 //     debug("HTMLHTMLHTMLHTMLHTMLHTMLHTML");
//                 //     // res.send(zipStream_.stream);
//                 //     res.send(zipData);
//             } else {

//                 // const counterStream = new CounterPassThroughStream(++streamCounter);
//                 // debug(`===> STREAM PIPE [${counterStream.id}] ${link ? link.Href : "link?"} /// ${pathInZip}`);

//                 zipStream_.stream // readable
//                     .on("error", function f(this: ReadableStream) {
//                         debug("ZIP ERROR " + pathInZip);
//                     })
//                     // .on("finish", function f(this: ReadableStream) {
//                     //     debug("ZIP FINISH " + counterStream.id + " = " + pathInZip);
//                     // })
//                     // .on("end", function f(this: ReadableStream) {
//                     //     debug("ZIP END " + counterStream.id + " = " + pathInZip);
//                     // })
//                     // .on("close", function f(this: ReadableStream) {
//                     //     debug("ZIP CLOSE " + counterStream.id + " = " + pathInZip);
//                     // })
//                     // .on("error", function f(this: ReadableStream) {
//                     //     debug("ZIP ERROR " + counterStream.id + " = " + pathInZip);
//                     // })
//                     // .on("pipe", function f(this: ReadableStream) {
//                     //     debug("ZIP PIPE " + counterStream.id + " = " + pathInZip);
//                     // })
//                     // .on("unpipe", function f(this: ReadableStream) {
//                     //     debug("ZIP UNPIPE " + counterStream.id + " = " + pathInZip);
//                     // })
//                     // .on("drain", function f(this: ReadableStream) {
//                     //     debug("ZIP DRAIN " + counterStream.id + " = " + pathInZip);
//                     // })
//                     // .on("pause", function f(this: ReadableStream) {
//                     //     debug("ZIP PAUSE " + counterStream.id + " = " + pathInZip);
//                     // })
//                     // .on("resume", function f(this: ReadableStream) {
//                     //     debug("ZIP RESUME " + counterStream.id + " = " + pathInZip);
//                     // })
//                     // .pipe(counterStream) // readable (zipStream_.stream) --> writable (counterStream is duplex)
//                     // .on("progress", function f(this: CounterPassThroughStream) {
//                     //     debug("CounterPassThroughStream PROGRESS: " +
//                     //         this.id + " -- " + this.bytesReceived + " = " + pathInZip);
//                     // })
//                     // .on("finish", function f(this: CounterPassThroughStream) {
//                     //     debug("CounterPassThroughStream FINISH: " +
//                     //         this.id +
//                     //         " -- " + this.bytesReceived + " = " + pathInZip);
//                     // })
//                     // .on("end", function f(this: CounterPassThroughStream) {
//                     //     debug("CounterPassThroughStream END: " +
//                     //         this.id + " = " + pathInZip);
//                     // })
//                     // .on("close", function f(this: CounterPassThroughStream) {
//                     //     debug("CounterPassThroughStream CLOSE: " +
//                     //         this.id + " = " + pathInZip);
//                     // })
//                     // .on("error", function f(this: CounterPassThroughStream) {
//                     //     debug("CounterPassThroughStream ERROR: " +
//                     //         this.id + " = " + pathInZip);
//                     // })
//                     // .on("pipe", function f(this: CounterPassThroughStream) {
//                     //     debug("CounterPassThroughStream PIPE: " +
//                     //         this.id + " = " + pathInZip);
//                     // })
//                     // .on("unpipe", function f(this: CounterPassThroughStream) {
//                     //     debug("CounterPassThroughStream UNPIPE: " +
//                     //         this.id + " = " + pathInZip);
//                     // })
//                     // .on("drain", function f(this: CounterPassThroughStream) {
//                     //     debug("CounterPassThroughStream DRAIN: " +
//                     //         this.id + " = " + pathInZip);
//                     // })
//                     // .on("pause", function f(this: CounterPassThroughStream) {
//                     //     debug("CounterPassThroughStream PAUSE: " +
//                     //         this.id + " = " + pathInZip);
//                     // })
//                     // .on("resume", function f(this: CounterPassThroughStream) {
//                     //     debug("CounterPassThroughStream RESUME: " +
//                     //         this.id + " = " + pathInZip);
//                     // })
//                     // readable (counterStream is duplex) --> writable (PassThrough is duplex)
//                     // .pipe(new PassThrough())
//                     // .on("finish", function f(this: PassThrough) {
//                     //     debug("PASS FINISH " + counterStream.id + " = " + pathInZip);
//                     // })
//                     // .on("end", function f(this: PassThrough) {
//                     //     debug("PASS END " + counterStream.id + " = " + pathInZip);
//                     // })
//                     // .on("close", function f(this: PassThrough) {
//                     //     debug("PASS CLOSE " + counterStream.id + " = " + pathInZip);
//                     // })
//                     // .on("error", function f(this: PassThrough) {
//                     //     debug("PASS ERROR " + counterStream.id + " = " + pathInZip);
//                     // })
//                     // .on("pipe", function f(this: PassThrough) {
//                     //     debug("PASS PIPE " + counterStream.id + " = " + pathInZip);
//                     // })
//                     // .on("unpipe", function f(this: PassThrough) {
//                     //     debug("PASS UNPIPE " + counterStream.id + " = " + pathInZip);
//                     // })
//                     // .on("drain", function f(this: PassThrough) {
//                     //     debug("PASS DRAIN " + counterStream.id + " = " + pathInZip);
//                     // })
//                     // .on("pause", function f(this: PassThrough) {
//                     //     debug("PASS PAUSE " + counterStream.id + " = " + pathInZip);
//                     // })
//                     // .on("resume", function f(this: PassThrough) {
//                     //     debug("PASS RESUME " + counterStream.id + " = " + pathInZip);
//                     // })
//                     .pipe(res) // readable (counterStream is duplex) --> writable (res)
//                     .on("error", function f(this: express.Response) {
//                         debug("RES ERROR " + pathInZip);
//                     })
//                     .on("close", function f(this: express.Response) {

//                         res.end(); // writable
//                     })
//                     // .on("finish", function f(this: express.Response) {
//                     //     debug("RES FINISH " + counterStream.id + " = " + pathInZip);
//                     // })
//                     // .on("end", function f(this: express.Response) {
//                     //     debug("RES END " + counterStream.id + " = " + pathInZip);
//                     // })
//                     // .on("close", function f(this: express.Response) {
//                     //     debug("RES CLOSE " + counterStream.id + " = " + pathInZip);

//                     //     res.end(); // writable

//                     //     // // readable (counterStream is duplex) --> writable (res)
//                     //     // counterStream.unpipe(res);

//                     //     // // duplex writable + readable
//                     //     // counterStream.end();

//                     //     // // readable (zipStream_.stream) --> writable (counterStream is duplex)
//                     //     // zipStream_.stream.unpipe(counterStream);

//                     //     // // zipStream_.stream.close();
//                     // })
//                     // .on("error", function f(this: express.Response) {
//                     //     debug("RES ERROR " + counterStream.id + " = " + pathInZip);
//                     // })
//                     // .on("pipe", function f(this: express.Response) {
//                     //     debug("RES PIPE " + counterStream.id + " = " + pathInZip);
//                     // })
//                     // .on("unpipe", function f(this: express.Response) {
//                     //     debug("RES UNPIPE " + counterStream.id + " = " + pathInZip);
//                     // })
//                     // .on("drain", function f(this: express.Response) {
//                     //     debug("RES DRAIN " + counterStream.id + " = " + pathInZip);
//                     // })
//                     // .on("pause", function f(this: express.Response) {
//                     //     debug("RES PAUSE " + counterStream.id + " = " + pathInZip);
//                     // })
//                     // .on("resume", function f(this: express.Response) {
//                     //     debug("RES RESUME " + counterStream.id + " = " + pathInZip);
//                     // })
//                     ;
//             }
//         });

//     routerPathBase64.param("asset", (req, _res, next, value, _name) => {
//         // Express 4 -> 5 wildcard (new router / path-to-regexp parser)
//         if (typeof value !== "string") {
//             if (Array.isArray(value)) {
//                 value = value.join("/");
//             }
//         }
//         // At this point, route relative path is already normalised with respect to /../ and /./ dot segments,
//         // but not double slashes (which seems to be an easy mistake to make at authoring time in EPUBs),
//         // so we collapse multiple slashes into a single one.
//         if (value) {
//             value = value.replace(/\/\/+/g, "/");
//         }

//         (req as IRequestPayloadExtension).asset = value;
//         next();
//     });

//     // RegExp.escape() NOT AVAILABLE in NodeJS yet new RegExp(RegExp.escape())
//     // routerPathBase64.use(new RegExp(regexpEscape("/:" + _pathBase64 + "/:" + _asset) + "(.*)"), routerAssets);
//     routerPathBase64.use("/:" + _pathBase64 + "/*" + _asset, routerAssets);
//     // Express 4 -> 5 wildcard (new router / path-to-regexp parser)
//     // routerPathBase64.use("/:" + _pathBase64 + "/:" + _asset + "(*)", routerAssets);
// }
