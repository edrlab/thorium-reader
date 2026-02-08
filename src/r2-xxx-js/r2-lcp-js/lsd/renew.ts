// // ==LICENSE-BEGIN==
// // Copyright 2017 European Digital Reading Lab. All rights reserved.
// // Licensed to the Readium Foundation under one or more contributor license agreements.
// // Use of this source code is governed by a BSD-style license
// // that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// // ==LICENSE-END==

// import debug_ from "debug";
// import * as request from "request";
// // import * as requestPromise from "request-promise-native";

// import { streamToBufferPromise } from "@r2-utils-js/_utils/stream/BufferUtils";

// import { LSD } from "../parser/epub/lsd";
// import { TaJsonDeserialize, TaJsonSerialize } from "../serializable";
// import { IDeviceIDManager } from "./deviceid-manager";

// // eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-require-imports
// import URI = require("urijs");
// // eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-require-imports
// import URITemplate = require("urijs/src/URITemplate");

// const debug = debug_("r2:lcp#lsd/renew");

// const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");

// export async function lsdRenew(
//     end: Date | undefined,
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     lsdJSON: any,
//     deviceIDManager: IDeviceIDManager,
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     httpHeaders?: { [key: string]: string; }): Promise<any> {

//     if (lsdJSON instanceof LSD) {
//         return lsdRenew_(end, lsdJSON as LSD, deviceIDManager);
//     }

//     let lsd: LSD | undefined;
//     try {
//         lsd = TaJsonDeserialize<LSD>(lsdJSON, LSD);
//     } catch (err) {
//         debug(err);
//         debug(lsdJSON);
//         // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
//         return Promise.reject("Bad LSD JSON?");
//     }

//     const obj = lsdRenew_(end, lsd, deviceIDManager, httpHeaders);
//     return TaJsonSerialize(obj);
// }

// export async function lsdRenew_(
//     end: Date | undefined,
//     lsd: LSD,
//     deviceIDManager: IDeviceIDManager,
//     httpHeaders?: { [key: string]: string; }): Promise<LSD> {

//     if (!lsd) {
//         // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
//         return Promise.reject("LCP LSD data is missing.");
//     }
//     if (!lsd.Links) {
//         // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
//         return Promise.reject("No LSD links!");
//     }

//     const licenseRenew = lsd.Links.find((link) => {
//         return link.Rel === "renew";
//     });
//     if (!licenseRenew) {
//         // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
//         return Promise.reject("No LSD renew link!");
//     }

//     let deviceID: string;
//     try {
//         deviceID = await deviceIDManager.getDeviceID();
//     } catch (err) {
//         debug(err);
//         // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
//         return Promise.reject("Problem getting Device ID !?");
//     }

//     let deviceNAME: string;
//     try {
//         deviceNAME = await deviceIDManager.getDeviceNAME();
//     } catch (err) {
//         debug(err);
//         // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
//         return Promise.reject("Problem getting Device NAME !?");
//     }

//     let renewURL: string = licenseRenew.Href;
//     if (licenseRenew.Templated) {
//         const urlTemplate = new URITemplate(renewURL);
//         const uri1 = urlTemplate.expand({ end: "xxx", id: deviceID, name: deviceNAME }, { strict: false });
//         renewURL = uri1.toString();

//         const uri2 = new URI(renewURL); // URIjs necessary for .search() to work
//         // TODO: urijs types broke this! (lib remains unchanged)
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         (uri2 as any).search((data: any) => {
//             // overrides existing (leaves others intact)
//             data.end = end?.toISOString(); // can be undefined
//         });
//         renewURL = uri2.toString();

//         // url = url.replace("{?end,id,name}", ""); // TODO: smarter regexp?
//         // url = new URI(url).setQuery("id", deviceID).setQuery("name", deviceNAME).toString();
//     }
//     if (IS_DEV) {
//         debug("RENEW: " + renewURL);
//     }

//     return new Promise<LSD>(async (resolve, reject) => {

//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         const failure = (err: any) => {
//             // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
//             reject(err);
//         };

//         const success = async (response: request.RequestResponse) => {

//             if (IS_DEV) {
//                 Object.keys(response.headers).forEach((header: string) => {
//                     debug(header + " => " + response.headers[header]);
//                 });
//             }

//             if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
//                 let failBuff: Buffer;
//                 try {
//                     failBuff = await streamToBufferPromise(response);
//                 } catch (buffErr) {
//                     if (IS_DEV) {
//                         debug(buffErr);
//                     }
//                     failure(response.statusCode);
//                     return;
//                 }
//                 try {
//                     const failStr = failBuff.toString("utf8");
//                     if (IS_DEV) {
//                         debug(failStr);
//                     }
//                     try {
//                         const failJson = global.JSON.parse(failStr);
//                         if (IS_DEV) {
//                             debug(failJson);
//                         }
//                         failJson.httpStatusCode = response.statusCode;
//                         failure(failJson);
//                     } catch (jsonErr) {
//                         if (IS_DEV) {
//                             debug(jsonErr);
//                         }
//                         failure({ httpStatusCode: response.statusCode, httpResponseBody: failStr });
//                     }
//                 } catch (strErr) {
//                     if (IS_DEV) {
//                         debug(strErr);
//                     }
//                     failure(response.statusCode);
//                 }
//                 return;
//             }

//             let responseData: Buffer;
//             try {
//                 responseData = await streamToBufferPromise(response);
//             } catch (err) {
//                 // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
//                 reject(err);
//                 return;
//             }
//             const responseStr = responseData.toString("utf8");
//             if (IS_DEV) {
//                 debug(responseStr);
//             }
//             const responseJson = global.JSON.parse(responseStr);
//             if (IS_DEV) {
//                 debug(responseJson);
//             }

//             try {
//                 const newLsd = TaJsonDeserialize<LSD>(responseJson, LSD);
//                 if (IS_DEV) {
//                     debug(newLsd);
//                 }
//                 resolve(newLsd);
//             } catch (err) {
//                 debug(err);
//                 resolve(responseJson);
//             }
//         };

//         const headers = Object.assign({
//             "Accept": "application/json,application/xml",
//             "Accept-Language": "en-UK,en-US;q=0.7,en;q=0.5",
//             "User-Agent": "Readium2-LCP",
//         }, httpHeaders ? httpHeaders : {});

//         // // No response streaming! :(
//         // // https://github.com/request/request-promise/issues/90
//         // const needsStreamingResponse = true;
//         // if (needsStreamingResponse) {
//             request.put({
//                 headers,
//                 method: "PUT",
//                 timeout: 5000,
//                 uri: renewURL,
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
//         //             method: "PUT",
//         //             resolveWithFullResponse: true,
//         //             uri: renewURL,
//         //         });
//         //     } catch (err) {
//         //         failure(err);
//         //         return;
//         //     }

//         //     await success(response);
//         // }
//     });
// }
