// // ==LICENSE-BEGIN==
// // Copyright 2017 European Digital Reading Lab. All rights reserved.
// // Licensed to the Readium Foundation under one or more contributor license agreements.
// // Use of this source code is governed by a BSD-style license
// // that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// // ==LICENSE-END==

// import debug_ from "debug";
// import * as request from "request";
// import * as unzipper from "unzipper";

// import { isHTTP } from "../http/UrlUtils";
// import { IStreamAndLength, IZip, Zip } from "./zip";

// const debug = debug_("r2:utils#zip/zip3");

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// interface IStringKeyedObject { [key: string]: any; }

// export class Zip3 extends Zip {

//     public static async loadPromise(filePath: string): Promise<IZip> {
//         if (isHTTP(filePath)) {
//             return Zip3.loadPromiseHTTP(filePath);
//         }

//         return new Promise<IZip>(async (resolve, reject) => {
//             // eslint-disable-next-line @typescript-eslint/no-explicit-any
//             let zip: any;
//             try {
//                 zip = await unzipper.Open.file(filePath);
//             } catch (err) {
//                 debug(err);
//                 // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
//                 reject(err);
//                 return;
//             }
//             debug(zip);
//             resolve(new Zip3(filePath, zip));
//         });
//     }

//     private static async loadPromiseHTTP(filePath: string): Promise<IZip> {

//         return new Promise<IZip>(async (resolve, reject) => {
//             // eslint-disable-next-line @typescript-eslint/no-explicit-any
//             let zip: any;
//             try {
//                 zip = await unzipper.Open.url(request.get,
//                     {
//                         headers: {},
//                         method: "GET",
//                         uri: filePath,
//                         url: filePath,
//                     });
//             } catch (err) {
//                 debug(err);
//                 // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
//                 reject(err);
//                 return;
//             }
//             debug(zip);
//             resolve(new Zip3(filePath, zip));
//         });
//     }

//     private entries: IStringKeyedObject;

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     private constructor(readonly filePath: string, readonly zip: any) {
//         super();

//         this.entries = {};
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         this.zip.files.forEach((file: any) => {
//             this.entries[file.path] = file;
//         });
//     }

//     public freeDestroy(): void {
//         debug("freeDestroy: Zip3 -- " + this.filePath);
//         if (this.zip) {
//             // TODO?
//             // this.zip.close();
//         }
//     }

//     public entriesCount(): number {
//         return this.zip.files.length;
//     }

//     public hasEntries(): boolean {
//         return this.entriesCount() > 0;
//     }

//     public hasEntry(entryPath: string): boolean {
//         return this.hasEntries() && this.entries[entryPath];
//     }

//     public async getEntries(): Promise<string[]> {

//         if (!this.hasEntries()) {
//             return Promise.resolve([]);
//         }
//         return Promise.resolve(Object.keys(this.entries));
//     }

//     public async entryStreamPromise(entryPath: string): Promise<IStreamAndLength> {

//         // debug(`entryStreamPromise: ${entryPath}`);

//         if (!this.hasEntries() || !this.hasEntry(entryPath)) {
//             // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
//             return Promise.reject("no such path in zip: " + entryPath);
//         }

//         return new Promise<IStreamAndLength>((resolve, _reject) => {

//             const entry = this.entries[entryPath];
//             debug(entry);

//             const stream: NodeJS.ReadableStream = entry.stream();
//             const streamAndLength: IStreamAndLength = {
//                 length: entry.size,
//                 reset: async () => {
//                     return this.entryStreamPromise(entryPath);
//                 },
//                 stream,
//             };
//             resolve(streamAndLength);
//         });
//     }
// }
