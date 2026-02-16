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

// import { LCP } from "../parser/epub/lcp";
// import { LSD, StatusEnum } from "../parser/epub/lsd";
// import { TaJsonDeserialize } from "../serializable";
// import { IDeviceIDManager } from "./deviceid-manager";
// import { lsdLcpUpdate } from "./lcpl-update";
// import { lsdRegister_ } from "./register";

// const debug = debug_("r2:lcp#lsd/status-document-processing");

// const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");

// export async function launchStatusDocumentProcessing(
//     lcp: LCP,
//     deviceIDManager: IDeviceIDManager,
//     onStatusDocumentProcessingComplete: (licenseUpdateJson: string | undefined) => void,
//     httpHeaders?: { [key: string]: string; }) {

//     if (!lcp || !lcp.Links) {
//         if (onStatusDocumentProcessingComplete) {
//             onStatusDocumentProcessingComplete(undefined);
//         }
//         return;
//     }
//     const linkStatus = lcp.Links.find((link) => {
//         return link.Rel === "status";
//     });
//     if (!linkStatus) {
//         if (onStatusDocumentProcessingComplete) {
//             onStatusDocumentProcessingComplete(undefined);
//         }
//         return;
//     }

//     if (IS_DEV) {
//         debug(linkStatus);
//     }

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const failure = (err: any) => {
//         debug(err);
//         if (onStatusDocumentProcessingComplete) {
//             onStatusDocumentProcessingComplete(undefined);
//         }
//     };

//     const success = async (response: request.RequestResponse) => {

//         if (IS_DEV) {
//             Object.keys(response.headers).forEach((header: string) => {
//                 debug(header + " => " + response.headers[header]);
//             });
//         }

//         if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
//             let failBuff: Buffer;
//             try {
//                 failBuff = await streamToBufferPromise(response);
//             } catch (buffErr) {
//                 if (IS_DEV) {
//                     debug(buffErr);
//                 }
//                 failure(response.statusCode);
//                 return;
//             }
//             try {
//                 const failStr = failBuff.toString("utf8");
//                 if (IS_DEV) {
//                     debug(failStr);
//                 }
//                 try {
//                     const failJson = global.JSON.parse(failStr);
//                     if (IS_DEV) {
//                         debug(failJson);
//                     }
//                     failJson.httpStatusCode = response.statusCode;
//                     failure(failJson);
//                 } catch (jsonErr) {
//                     if (IS_DEV) {
//                         debug(jsonErr);
//                     }
//                     failure({ httpStatusCode: response.statusCode, httpResponseBody: failStr });
//                 }
//             } catch (strErr) {
//                 if (IS_DEV) {
//                     debug(strErr);
//                 }
//                 failure(response.statusCode);
//             }
//             return;
//         }

//         let responseData: Buffer;
//         try {
//             responseData = await streamToBufferPromise(response);
//         } catch (err) {
//             debug(err);
//             if (onStatusDocumentProcessingComplete) {
//                 onStatusDocumentProcessingComplete(undefined);
//             }
//             return;
//         }
//         const responseStr = responseData.toString("utf8");

//         // https://github.com/readium/readium-lcp-specs/issues/15#issuecomment-358247286
//         // application/vnd.readium.lcp.license-1.0+json (LEGACY)
//         // application/vnd.readium.lcp.license.v1.0+json (NEW)
//         // application/vnd.readium.license.status.v1.0+json (LSD)
//         const mime = "application/vnd.readium.license.status.v1.0+json";
//         if (IS_DEV) {
//             if (response.headers["content-type"] === mime ||
//                 response.headers["content-type"] === "application/json") {
//                 debug(responseStr);
//             }
//         }
//         const lsdJSON = global.JSON.parse(responseStr);
//         if (IS_DEV) {
//             debug(lsdJSON);
//         }

//         try {
//             lcp.LSD = TaJsonDeserialize<LSD>(lsdJSON, LSD);
//             if (IS_DEV) {
//                 debug(lcp.LSD);
//             }
//         } catch (err) {
//             debug(err);
//             if (onStatusDocumentProcessingComplete) {
//                 onStatusDocumentProcessingComplete(undefined);
//             }
//             return;
//         }

//         // debug(lsdJson.id);
//         // debug(lsdJson.status); // revoked, returned, cancelled, expired
//         // debug(lsdJson.message);
//         // if (lsdJson.updated) {
//         //     debug(lsdJson.updated.license);
//         //     debug(lsdJson.updated.status);
//         // }
//         // if (lsdJson.links) {
//         //     lsdJson.links.forEach((link: any) => {
//         //         debug(link.rel); // license, register, return, renew
//         //         debug(link.href);
//         //         debug(link.type);
//         //         debug(link.templated);
//         //         debug(link.title);
//         //         debug(link.profile);
//         //     });
//         // }
//         // if (lsdJson.potential_rights) {
//         //     debug(lsdJson.potential_rights.end);
//         // }
//         // if (lsdJson.events) {
//         //     lsdJson.events.forEach((event: any) => {
//         //         debug(event.type);
//         //         debug(event.name);
//         //         debug(event.timestamp); // ISO 8601 time and date
//         //         debug(event.id);
//         //     });
//         // }

//         let licenseUpdateResponseJson: string | undefined;
//         try {
//             licenseUpdateResponseJson = await lsdLcpUpdate(lcp, httpHeaders);
//         } catch (err) {
//             debug(err);
//             // if (onStatusDocumentProcessingComplete) {
//             //     onStatusDocumentProcessingComplete();
//             // }
//             // return;
//         }
//         if (licenseUpdateResponseJson) {
//             if (onStatusDocumentProcessingComplete) {
//                 onStatusDocumentProcessingComplete(licenseUpdateResponseJson);
//             }
//             return;
//         }

//         // lcp.LSD.Status !== StatusEnum.Active && lcp.LSD.Status !== StatusEnum.Ready
//         if (lcp.LSD.Status === StatusEnum.Revoked
//             || lcp.LSD.Status === StatusEnum.Returned
//             || lcp.LSD.Status === StatusEnum.Cancelled
//             || lcp.LSD.Status === StatusEnum.Expired) {

//             debug("What?! LSD status:" + lcp.LSD.Status);
//             // This should really never happen,
//             // as the LCP license should not even have passed validation
//             // due to expired end date / timestamp
//             if (onStatusDocumentProcessingComplete) {
//                 onStatusDocumentProcessingComplete(undefined);
//             }
//             return;
//         }

//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         let registerResponse: any;
//         try {
//             registerResponse = await lsdRegister_(lcp.LSD, deviceIDManager, httpHeaders);
//         } catch (err) {
//             debug(err);
//         }
//         if (registerResponse) {
//             lcp.LSD = registerResponse;
//             if (IS_DEV) {
//                 debug(lcp.LSD);
//             }
//         }
//         if (onStatusDocumentProcessingComplete) {
//             onStatusDocumentProcessingComplete(undefined);
//         }
//     };

//     const headers = Object.assign({
//         "Accept": "application/json,application/xml",
//         "Accept-Language": "en-UK,en-US;q=0.7,en;q=0.5",
//         "User-Agent": "Readium2-LCP",
//     }, httpHeaders ? httpHeaders : {});

//     // // No response streaming! :(
//     // // https://github.com/request/request-promise/issues/90
//     // const needsStreamingResponse = true;
//     // if (needsStreamingResponse) {
//         request.get({
//             headers,
//             method: "GET",
//             timeout: 2000,
//             uri: linkStatus.Href,
//         })
//             .on("response", async (res) => {
//                 try {
//                     await success(res);
//                 }
//                 catch (successError) {
//                     failure(successError);
//                     return;
//                 }
//             })
//             .on("error", failure);
//     // } else {
//     //     let response: requestPromise.FullResponse;
//     //     try {
//     //         // tslint:disable-next-line:await-promise no-floating-promises
//     //         response = await requestPromise({
//     //             headers,
//     //             method: "GET",
//     //             resolveWithFullResponse: true,
//     //             uri: linkStatus.Href,
//     //         });
//     //     } catch (err) {
//     //         failure(err);
//     //         return;
//     //     }

//     //     await success(response);
//     // }
// }
