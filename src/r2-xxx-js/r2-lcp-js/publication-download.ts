// // ==LICENSE-BEGIN==
// // Copyright 2017 European Digital Reading Lab. All rights reserved.
// // Licensed to the Readium Foundation under one or more contributor license agreements.
// // Use of this source code is governed by a BSD-style license
// // that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// // ==LICENSE-END==

// import debug_ from "debug";
// import * as fs from "fs";
// import * as path from "path";
// import * as request from "request";
// // import * as requestPromise from "request-promise-native";

// import { streamToBufferPromise } from "@r2-utils-js/_utils/stream/BufferUtils";
// import { injectFileInZip } from "@r2-utils-js/_utils/zip/zipInjector";

// import { LCP } from "./parser/epub/lcp";
// import { TaJsonDeserialize } from "./serializable";

// const debug = debug_("r2:lcp#publication-download");

// const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");

// export async function downloadEPUBFromLCPL(filePath: string, dir: string, destFileName: string): Promise<string[]> {

//     return new Promise<string[]>(async (resolve, reject) => {

//         const lcplStr = fs.readFileSync(filePath, { encoding: "utf8" });
//         // debug(lcplStr);
//         const lcplJson = global.JSON.parse(lcplStr);
//         const lcpl = TaJsonDeserialize<LCP>(lcplJson, LCP);
//         if (lcpl.Links) {
//             const pubLink = lcpl.Links.find((link) => {
//                 return link.Rel === "publication";
//             });
//             if (pubLink) {

//                 const isAudio = pubLink.Type === "application/audiobook+zip";
//                 const isAudioLcp = pubLink.Type === "application/audiobook+lcp";

//                 const ext = isAudio ? ".audiobook" : (isAudioLcp ? ".lcpa" : ".epub");

//                 const destPathTMP = path.join(dir, destFileName + ".tmp");
//                 const destPathFINAL = path.join(dir, destFileName + ext);

//                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
//                 const failure = (err: any) => {
//                     debug(err);
//                     // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
//                     reject(pubLink.Href + " (" + err + ")");
//                 };

//                 const success = async (response: request.RequestResponse) => {
//                     if (IS_DEV) {
//                         Object.keys(response.headers).forEach((header: string) => {
//                             debug(header + " => " + response.headers[header]);
//                         });
//                     }

//                     if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
//                         let failBuff: Buffer;
//                         try {
//                             failBuff = await streamToBufferPromise(response);
//                         } catch (buffErr) {
//                             if (IS_DEV) {
//                                 debug(buffErr);
//                             }
//                             failure(response.statusCode);
//                             return;
//                         }
//                         try {
//                             const failStr = failBuff.toString("utf8");
//                             if (IS_DEV) {
//                                 debug(failStr);
//                             }
//                             try {
//                                 const failJson = global.JSON.parse(failStr);
//                                 if (IS_DEV) {
//                                     debug(failJson);
//                                 }
//                                 failJson.httpStatusCode = response.statusCode;
//                                 failure(failJson);
//                             } catch (jsonErr) {
//                                 if (IS_DEV) {
//                                     debug(jsonErr);
//                                 }
//                                 failure({ httpStatusCode: response.statusCode, httpResponseBody: failStr });
//                             }
//                         } catch (strErr) {
//                             if (IS_DEV) {
//                                 debug(strErr);
//                             }
//                             failure(response.statusCode);
//                         }
//                         return;
//                     }

//                     const destStreamTMP = fs.createWriteStream(destPathTMP);
//                     response.pipe(destStreamTMP);
//                     // response.on("end", () => {
//                     // });
//                     destStreamTMP.on("finish", () => {

//                         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//                         const zipError = (err: any) => {
//                             debug(err);
//                             // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
//                             reject(destPathTMP + " (" + err + ")");
//                         };

//                         const doneCallback = () => {
//                             setTimeout(() => {
//                                 fs.unlinkSync(destPathTMP);
//                             }, 1000);

//                             resolve([destPathFINAL, pubLink.Href]);
//                         };

//                         const zipEntryPath = (isAudio || isAudioLcp) ? "license.lcpl" : "META-INF/license.lcpl";

//                         injectFileInZip(destPathTMP, destPathFINAL, filePath, zipEntryPath, zipError, doneCallback);
//                     });
//                 };

//                 // // No response streaming! :(
//                 // // https://github.com/request/request-promise/issues/90
//                 // const needsStreamingResponse = true;
//                 // if (needsStreamingResponse) {
//                     request.get({
//                         headers: {},
//                         method: "GET",
//                         timeout: 5000,
//                         uri: pubLink.Href,
//                     })
//                         .on("response", async (res) => {
//                             try {
//                                 await success(res);
//                             }
//                             catch (successError) {
//                                 failure(successError);
//                                 return;
//                             }
//                         })
//                         .on("error", failure);
//                 // } else {
//                 //     let response: requestPromise.FullResponse;
//                 //     try {
//                 //         // tslint:disable-next-line:await-promise no-floating-promises
//                 //         response = await requestPromise({
//                 //             headers: {},
//                 //             method: "GET",
//                 //             resolveWithFullResponse: true,
//                 //             uri: pubLink.Href,
//                 //         });
//                 //     } catch (err) {
//                 //         failure(err);
//                 //         return;
//                 //     }

//                 //     await success(response);
//                 // }
//             }
//         }
//     });
// }
