// // ==LICENSE-BEGIN==
// // Copyright 2017 European Digital Reading Lab. All rights reserved.
// // Licensed to the Readium Foundation under one or more contributor license agreements.
// // Use of this source code is governed by a BSD-style license
// // that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// // ==LICENSE-END==

// import * as fs from "fs";
// import * as path from "path";

// import { streamToBufferPromise } from "@r2-utils-js/_utils/stream/BufferUtils";
// import { IStreamAndLength, IZip } from "@r2-utils-js/_utils/zip/zip";
// import { ZipExploded } from "@r2-utils-js/_utils/zip/zip-ex";
// import { Zip1 } from "@r2-utils-js/_utils/zip/zip1";
// import { Zip2 } from "@r2-utils-js/_utils/zip/zip2";
// import { Zip3 } from "@r2-utils-js/_utils/zip/zip3";

// console.log("process.cwd():");
// console.log(process.cwd());

// console.log("__dirname:");
// console.log(__dirname);

// const args = process.argv.slice(2);
// console.log("args:");
// console.log(args);

// if (!args[0]) {
//     console.log("FILEPATH ARGUMENT IS MISSING.");
//     process.exit(1);
// }
// const argPath = args[0].trim();
// let filePath = argPath;
// console.log(filePath);
// if (!fs.existsSync(filePath)) {
//     filePath = path.join(__dirname, argPath);
//     console.log(filePath);
//     if (!fs.existsSync(filePath)) {
//         filePath = path.join(process.cwd(), argPath);
//         console.log(filePath);
//         if (!fs.existsSync(filePath)) {
//             console.log("FILEPATH DOES NOT EXIST.");
//             process.exit(1);
//         }
//     }
// }

// const stats = fs.lstatSync(filePath);
// if (!stats.isFile() && !stats.isDirectory()) {
//     console.log("FILEPATH MUST BE FILE OR DIRECTORY.");
//     process.exit(1);
// }

// const fileName = path.basename(filePath);
// const ext = path.extname(fileName);

// if (stats.isDirectory()) {
//     // tslint:disable-next-line:no-floating-promises
//     (async () => {
//         const zipExploded: IZip = await ZipExploded.loadPromise(filePath);
//         const entries = await zipExploded.getEntries();
//         for (const entryName of entries) {
//             console.log("############## " + entryName);

//             let zipStream_: IStreamAndLength;
//             try {
//                 zipStream_ = await zipExploded.entryStreamPromise(entryName);
//             } catch (err) {
//                 console.log(err);
//                 return;
//             }
//             const zipStream = zipStream_.stream;
//             let zipData: Buffer;
//             try {
//                 zipData = await streamToBufferPromise(zipStream);
//             } catch (err) {
//                 console.log(err);
//                 return;
//             }

//             if (/\.css$/i.test(entryName)) {
//                 const str = zipData.toString("utf8");
//                 console.log(str);
//             }
//         }
//     })();
// } else if (/((\.epub3?)|(\.cbz)|(\.zip))$/i.test(ext)) {
//     // tslint:disable-next-line:no-floating-promises
//     (async () => {
//         const time3 = process.hrtime();
//         const zip3: IZip = await Zip3.loadPromise(filePath);
//         const diff3 = process.hrtime(time3);
//         console.log(`Zip 3 (${zip3.entriesCount()}): ${diff3[0]} seconds + ${diff3[1]} nanoseconds`);

//         const time2 = process.hrtime();
//         const zip2: IZip = await Zip2.loadPromise(filePath);
//         const diff2 = process.hrtime(time2);
//         console.log(`Zip 2 (${zip2.entriesCount()}): ${diff2[0]} seconds + ${diff2[1]} nanoseconds`);

//         const time1 = process.hrtime();
//         const zip1: IZip = await Zip1.loadPromise(filePath);
//         const diff1 = process.hrtime(time1);
//         // const nanos = diff1[0] * 1e9 + diff1[1];
//         console.log(`Zip 1 (${zip1.entriesCount()}): ${diff1[0]} seconds + ${diff1[1]} nanoseconds`);

//         // const entries = await zip1.getEntries();
//         // for (const entryName of entries) {
//         //     console.log(entryName);
//         // }
//     })();
// }
