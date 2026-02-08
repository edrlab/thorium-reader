// // ==LICENSE-BEGIN==
// // Copyright 2017 European Digital Reading Lab. All rights reserved.
// // Licensed to the Readium Foundation under one or more contributor license agreements.
// // Use of this source code is governed by a BSD-style license
// // that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// // ==LICENSE-END==

// // USAGE:
// // DEBUG=1 npm run cli-crc "/PATH/TO/EPUBs/" "1"
// // "/PATH/TO/EPUBs/" can be a single file "/PATH/TO/EPUB.epub" (instead of a folder)
// // => the DEBUG env var enables verbose console logging (remove completely to disable)
// // => the "1" trailing command line argument enables resource streaming (in addition to ZIP directory CRC checks)

// import * as fs from "fs";
// import * as path from "path";

// // ZIP 1
// // eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-require-imports
// import StreamZip = require("node-stream-zip");

// // ZIP 2
// import * as yauzl from "yauzl";

// // ZIP 3
// import * as unzipper from "unzipper";

// // import * as filehound from "filehound";

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

// const argExtra = args[1] ? args[1].trim() : undefined;
// const READ_ZIP_STREAMS = argExtra === "1";

// const UNVERBOSE = false;
// const VERBOSE = process.env.DEBUG || false;
// const N_ITERATIONS = (READ_ZIP_STREAMS && VERBOSE) ? 1 : (READ_ZIP_STREAMS ? 5 : 10);

// async function streamReadAll(readStream: NodeJS.ReadableStream): Promise<number> {

//     return new Promise<number>((resolve, reject) => {

//         let totalBytes = 0;

//         const cleanup = () => {
//             readStream.removeListener("data", handleData);
//             readStream.removeListener("error", handleError);
//             readStream.removeListener("end", handleEnd);
//         };

//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         const handleError = (err: any) => {
//             cleanup();
//             // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
//             reject(err);
//         };
//         readStream.on("error", handleError);

//         const handleData = (data: Buffer) => {
//             totalBytes += data.length;
//         };
//         readStream.on("data", handleData);

//         const handleEnd = () => {
//             cleanup();
//             resolve(totalBytes);
//         };
//         readStream.on("end", handleEnd);
//     });
// }

// const zip1 = async (file: string): Promise<number[]> => {
//     return new Promise<number[]>((resolve, reject) => {

//         const zip = new StreamZip({
//             file,
//             storeEntries: true,
//         });

//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         zip.on("error", (err: any) => {
//             console.log("--ZIP error: " + filePath);
//             console.log(err);

//             // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
//             reject(err);
//         });

//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         zip.on("entry", (_entry: any) => {
//             // console.log("--ZIP: entry");
//             // console.log(entry.name);
//         });

//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         zip.on("extract", (entry: any, f: any) => {
//             console.log("--ZIP extract:");
//             console.log(entry.name);
//             console.log(f);
//         });

//         zip.on("ready", async () => {
//             // console.log("--ZIP: ready");
//             // console.log(zip.entriesCount);

//             // eslint-disable-next-line @typescript-eslint/no-explicit-any
//             const zipEntries = Object.values(zip.entries()) as any[];

//             // eslint-disable-next-line @typescript-eslint/no-explicit-any
//             const crcs = zipEntries.map((zipEntry: any) => {
//                 // if (/\/$/.test(zipEntry.name)) {
//                 if (zipEntry.isDirectory) { // zipEntry.name[zipEntry.name.length - 1] === "/"
//                     // skip directories / folders
//                     return 0;
//                 } else {
//                     if (!zipEntry.crc && zipEntry.size) {
//                         console.log(`1 CRC zero? ${zipEntry.name} (${zipEntry.size} bytes) => ${zipEntry.crc}`);
//                     }
//                     return zipEntry.crc as number;
//                 }
//             }).filter((val: number) => {
//                 return val; // falsy includes zero, null, undefined
//             });

//             if (READ_ZIP_STREAMS) {
//                 if (VERBOSE) {
//                     process.stdout.write("## 1 ##\n");
//                 }
//                 for (const zipEntry of zipEntries) {
//                     if (zipEntry.isDirectory) {
//                         continue;
//                     }
//                     const promize = new Promise((res, rej) => {
//                         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//                         zip.stream(zipEntry.name, async (err: any, stream: NodeJS.ReadableStream) => {
//                             if (err) {
//                                 console.log(err);
//                                 // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
//                                 rej(err);
//                                 return;
//                             }
//                             // stream.pipe(process.stdout);
//                             const totalBytes = streamReadAll(stream);
//                             process.nextTick(() => {
//                                 res(totalBytes);
//                             });
//                         });
//                     });
//                     const size = await promize;
//                     if (zipEntry.size !== size) {
//                         console.log(`1 SIZE MISMATCH? ${zipEntry.name} ${zipEntry.size} != ${size}`);
//                     }

//                     if (VERBOSE) {
//                         process.stdout.write(` ${zipEntry.name} `);
//                     } else if (!UNVERBOSE) {
//                         process.stdout.write(".");
//                     }
//                 }
//                 if (!UNVERBOSE) {
//                     process.stdout.write("\n");
//                 }
//             }

//             process.nextTick(() => {
//                 zip.close();
//                 process.nextTick(() => {
//                     resolve(crcs);
//                 });
//             });
//         });
//     });
// };
// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// (zip1 as any).zipName = "node-stream-zip";

// const zip2 = async (file: string): Promise<number[]> => {
//     return new Promise<number[]>((resolve, reject) => {
//         let crcs: number[] | undefined;
//         yauzl.open(file, { lazyEntries: true, autoClose: false }, (error, zip) => {
//             if (error || !zip) {
//                 console.log("yauzl init ERROR");
//                 console.log(error);
//                 // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
//                 reject(error);
//                 return;
//             }

//             zip.on("error", (erro) => {
//                 console.log("yauzl ERROR");
//                 console.log(erro);
//                 // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
//                 reject(erro);
//             });

//             if (READ_ZIP_STREAMS && VERBOSE) {
//                 process.stdout.write("## 2 ##\n");
//             }

//             zip.readEntry(); // next (lazyEntries)
//             zip.on("entry", async (zipEntry) => {
//                 // if (/\/$/.test(entry.fileName)) {
//                 if (zipEntry.fileName[zipEntry.fileName.length - 1] === "/") {
//                     // skip directories / folders
//                 } else {
//                     if (!zipEntry.crc32 && zipEntry.uncompressedSize) {
//                         // tslint:disable-next-line:max-line-length
//                         console.log(`2 CRC zero? ${zipEntry.fileName} (${zipEntry.uncompressedSize} bytes) => ${zipEntry.crc32}`);
//                     }
//                     if (!crcs) {
//                         crcs = [];
//                     }
//                     crcs.push(zipEntry.crc32 as number);

//                     if (READ_ZIP_STREAMS) {
//                         const promize = new Promise((res, rej) => {
//                             zip.openReadStream(zipEntry, (err, stream) => {
//                                 if (err || !stream) {
//                                     console.log(err);
//                                     // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
//                                     rej(err);
//                                     return;
//                                 }
//                                 // stream.pipe(process.stdout);
//                                 const totalBytes = streamReadAll(stream);
//                                 process.nextTick(() => {
//                                     res(totalBytes);
//                                 });
//                             });
//                         });
//                         const size = await promize;
//                         if (zipEntry.uncompressedSize !== size) {
//                             // tslint:disable-next-line:max-line-length
//                             console.log(`2 SIZE MISMATCH? ${zipEntry.fileName} ${zipEntry.uncompressedSize} != ${size}`);
//                         }

//                         if (VERBOSE) {
//                             process.stdout.write(` ${zipEntry.fileName} `);
//                         } else if (!UNVERBOSE) {
//                             process.stdout.write(".");
//                         }
//                     }
//                 }

//                 zip.readEntry(); // next (lazyEntries)
//             });

//             zip.on("end", () => {
//                 // console.log("yauzl END");

//                 if (READ_ZIP_STREAMS && !UNVERBOSE) {
//                     process.stdout.write("\n");
//                 }

//                 process.nextTick(() => {
//                     zip.close(); // not autoClose
//                     process.nextTick(() => {
//                         if (!crcs) {
//                             // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
//                             reject(crcs);
//                             return;
//                         }
//                         resolve(crcs.filter((val) => {
//                             return val; // falsy includes zero, null, undefined
//                         }));
//                     });
//                 });
//             });

//             zip.on("close", () => {
//                 // console.log("yauzl CLOSE");
//             });
//         });
//     });
// };
// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// (zip2 as any).zipName = "yauzl";

// // <<< UNZIPPER_BUG
// // https://github.com/ZJONSSON/node-unzipper/issues/104
// // events.js:174
// // throw er; // Unhandled 'error' event
// // Error: EBADF: bad file descriptor, read
// // Emitted 'error' event at:
// // at lazyFs.read (internal/fs/streams.js:165:12)
// // at FSReqWrap.wrapper [as oncomplete] (fs.js:467:17)
// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// const streams: any = {};
// // >>> UNZIPPER_BUG

// const zip3 = async (file: string): Promise<number[]> => {
//     return new Promise<number[]>(async (resolve, reject) => {
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         let zip: any;
//         try {
//             zip = await unzipper.Open.file(file);
//         } catch (err) {
//             console.log(err);
//             // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
//             reject(err);
//             return;
//         }
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         const crcs = zip.files.map((zipEntry: any) => {
//             // if (/\/$/.test(zipEntry.path)) {
//             if (zipEntry.type === "Directory") { // zipEntry.path[zipEntry.path.length - 1] === "/")
//                 // skip directories / folders
//                 return 0;
//             } else {
//                 if (!zipEntry.crc32 && zipEntry.uncompressedSize) {
//                     // tslint:disable-next-line:max-line-length
//                     console.log(`3 CRC zero? ${zipEntry.path} (${zipEntry.uncompressedSize} bytes) => ${zipEntry.crc32}`);
//                 }
//                 return zipEntry.crc32 as number;
//             }
//         }).filter((val: number) => {
//             return val; // falsy includes zero, null, undefined
//         });

//         if (READ_ZIP_STREAMS) {
//             if (VERBOSE) {
//                 process.stdout.write("## 3 ##\n");
//             }
//             for (const zipEntry of zip.files) {
//                 if (zipEntry.type === "Directory") {
//                     continue;
//                 }
//                 const stream = zipEntry.stream();

//                 // <<< UNZIPPER_BUG
//                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
//                 stream.on("error", (err: any) => {
//                     console.log("err1");
//                     console.log(err);
//                 });
//                 stream.__ZIP_FILE_PATH = file;
//                 stream.__ZIP_RESOURCE_PATH = zipEntry.path;
//                 if (!streams[file]) {
//                     streams[file] = {};
//                 }
//                 streams[file][zipEntry.path] = stream; // prevents premature garbage collection

//                 // event sequence: FINISH, then END
//                 stream.on("end", () => {
//                     // console.log(`${zipEntry.path} END`);

//                     process.nextTick(() => {
//                         // console.log(`${stream.__ZIP_FILE_PATH} ${stream.__ZIP_RESOURCE_PATH} CLEAN`);
//                         // streams[stream.__ZIP_FILE_PATH][stream.__ZIP_RESOURCE_PATH] = null;
//                         delete streams[stream.__ZIP_FILE_PATH][stream.__ZIP_RESOURCE_PATH];
//                     });

//                     // setTimeout(() => {
//                     //     return stream; // prevents premature garbage collection
//                     // }, 200);
//                 });
//                 // >>> UNZIPPER_BUG

//                 const promize = streamReadAll(stream);
//                 let size: number;
//                 try {
//                     size = await promize;
//                 } catch (err) {
//                     console.log("err2");
//                     console.log(err);
//                     // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
//                     reject(err);
//                     return;
//                 }

//                 if (zipEntry.uncompressedSize !== size) {
//                     console.log(`3 SIZE MISMATCH? ${zipEntry.path} ${zipEntry.uncompressedSize} != ${size}`);
//                 }

//                 if (VERBOSE) {
//                     process.stdout.write(` ${zipEntry.path} `);
//                 } else if (!UNVERBOSE) {
//                     process.stdout.write(".");
//                 }
//             }
//             if (!UNVERBOSE) {
//                 process.stdout.write("\n");
//             }

//             // <<< UNZIPPER_BUG
//             process.nextTick(() => {
//                 // streams[file] = null;
//                 delete streams[file];
//             });
//             // >>> UNZIPPER_BUG
//         }

//         resolve(crcs);
//     });
// };
// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// (zip3 as any).zipName = "unzipper";

// const zips = READ_ZIP_STREAMS ? [zip1, zip2] : // <<< UNZIPPER_BUG
//     [zip1, zip2, zip3];

// async function processFile(file: string) {
//     console.log("=====================================");
//     if (!UNVERBOSE) {
//         console.log(`${file}`);
//         console.log("=====================================");
//     }

//     let winner = 0;
//     let minNanoOverall = Number.MAX_SAFE_INTEGER;

//     let iZip = 0;
//     for (const zip of zips) {
//         iZip++;

//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         (zip as any).minNano = Number.MAX_SAFE_INTEGER;

//         if (VERBOSE) {
//             console.log("-------------------------------");
//         }

//         let crcsPreviousIteration: number[] | undefined;
//         for (let i = 0; i < N_ITERATIONS; i++) {
//             process.stdout.write(`${i + 1}/${N_ITERATIONS} `);

//             const time = process.hrtime();
//             const crcs = await zip(file);
//             const diffTime = process.hrtime(time);

//             // await new Promise((res, _rej) => {
//             //     setTimeout(() => {
//             //         res();
//             //     }, 100);
//             // });

//             const nanos = diffTime[0] * 1e9 + diffTime[1];
//             // eslint-disable-next-line @typescript-eslint/no-explicit-any
//             if (nanos < (zip as any).minNano) {
//                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
//                 (zip as any).minNano = nanos;
//             }
//             if (nanos < minNanoOverall) {
//                 minNanoOverall = nanos;
//                 winner = iZip;
//             }

//             if (VERBOSE) {
//                 // tslint:disable-next-line:max-line-length
//                 console.log(`Zip ${iZip} (${crcs.length}): ${diffTime[0]} seconds + ${diffTime[1]} nanoseconds`);
//             }

//             // if (crcs.includes(0)) {
//             //     console.log(JSON.stringify(crcs, null, 2));
//             // }

//             if (crcsPreviousIteration) {
//                 if (!sameArrays(crcsPreviousIteration, crcs)) {

//                     console.log(`++++ Zip ${iZip} (ITERATION ${i}) CRC DIFF!?`);
//                     console.log(`-- ${crcsPreviousIteration.length}:`);
//                     console.log(JSON.stringify(crcsPreviousIteration, null, 2));
//                     console.log(`-- ${crcs.length}:`);
//                     console.log(JSON.stringify(crcs, null, 2));
//                     process.exit(1);
//                 }
//             }
//             crcsPreviousIteration = crcs;
//         }
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         (zip as any).CRCs = crcsPreviousIteration;

//         if (!VERBOSE) {
//             console.log("\n");
//         }

//     }

//     let crcsPreviousZip: number[] | undefined;
//     let isDiff = false;
//     for (const zip of zips) {
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         if (crcsPreviousZip && (zip as any).CRCs) {

//             // eslint-disable-next-line @typescript-eslint/no-explicit-any
//             isDiff = !sameArrays(crcsPreviousZip, (zip as any).CRCs);
//             // if (crcsPreviousZip.length !== (zip as any).CRCs.length) {
//             //     isDiff = true;
//             //     break;
//             // } else {
//             //     for (let j = 0; j < (zip as any).CRCs.length; j++) {
//             //         if ((zip as any).CRCs[j] !== crcsPreviousZip[j]) {
//             //             isDiff = true;
//             //             break;
//             //         }
//             //     }
//             // }
//             if (isDiff) {
//                 break;
//             }
//         }
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         crcsPreviousZip = (zip as any).CRCs;
//     }
//     if (isDiff) {
//         console.log("CRC DIFF! ##############################################");
//         iZip = 0;
//         for (const zip of zips) {
//             iZip++;
//             console.log("==========================");
//             console.log(`++++ Zip ${iZip} CRC:`);
//             // eslint-disable-next-line @typescript-eslint/no-explicit-any
//             console.log(`-- ${(zip as any).CRCs.length}:`);
//             // eslint-disable-next-line @typescript-eslint/no-explicit-any
//             console.log(JSON.stringify((zip as any).CRCs));
//         }

//         for (let j = 0; j < zips.length; j++) {
//             const zip = zips[j];
//             let nDiffs = 0;
//             for (let k = 0; k < zips.length; k++) {
//                 if (j === k) {
//                     continue;
//                 }
//                 const zip_ = zips[k];
//                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
//                 if (!sameArrays((zip as any).CRCs, (zip_ as any).CRCs)) {
//                     nDiffs++;
//                 }
//             }
//             if (nDiffs === (zips.length - 1)) {
//                 console.log("####################################");
//                 console.log("####################################");
//                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
//                 console.log(`SUSPECT ====> Zip ${j + 1} (${(zip as any).zipName})`);
//                 console.log("####################################");
//                 console.log("####################################");
//             }
//         }

//         process.exit(1);
//     }

//     if (VERBOSE) {
//         console.log("=====================================");
//     }

//     iZip = 0;
//     for (const zip of zips) {
//         iZip++;
//         const won = iZip === winner;
//         // tslint:disable-next-line:max-line-length
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         console.log(`${won ? ">>" : "--"} Zip ${iZip} (${(zip as any).zipName}) => ${(zip as any).minNano.toLocaleString()} nanoseconds ${won ? " [ WINNER ]" : `[ +${((zip as any).minNano - minNanoOverall).toLocaleString()} ]`}`);
//     }
// }

// if (stats.isDirectory()) {

//     // tslint:disable-next-line:no-floating-promises
//     (async () => {
//         // const files: string[] = await filehound.create()
//         //     // .discard("node_modules")
//         //     // .depth(5)
//         //     .paths(filePath)
//         //     .ext([".epub", ".epub3", ".cbz", ".zip"])
//         //     // .directory()
//         //     .find();
//         const files = fs.readdirSync(filePath, { withFileTypes: true }).
//             filter((f) => f.isFile() &&
//                 /((\.epub3?)|(\.zip)|(\.cbz))$/i.test(f.name)).
//             map((f) => path.join(filePath, f.name));

//         for (const file of files) {
//             await processFile(file);
//         }
//     })();

// } else if (/((\.epub3?)|(\.cbz)|(\.zip))$/i.test(ext)) {
//     // tslint:disable-next-line:no-floating-promises
//     (async () => {
//         await processFile(filePath);
//     })();
// }

// function sameArrays(arr1: number[], arr2: number[]) {
//     if (arr1.length !== arr2.length) {
//         return false;
//     }
//     for (let j = 0; j < arr1.length; j++) {
//         if (arr1[j] !== arr2[j]) {
//             return false;
//         }
//     }
//     return true;
// }
