// // ==LICENSE-BEGIN==
// // Copyright 2017 European Digital Reading Lab. All rights reserved.
// // Licensed to the Readium Foundation under one or more contributor license agreements.
// // Use of this source code is governed by a BSD-style license
// // that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// // ==LICENSE-END==

// import debug_ from "debug";
// import * as fs from "fs";
// import * as path from "path";
// import * as watcher from "@parcel/watcher";

// import { setLcpNativePluginPath } from "@r2-lcp-js/parser/epub/lcp";
// import { initGlobalConverters_OPDS } from "@r2-opds-js/opds/init-globals";
// import {
//     initGlobalConverters_GENERIC, initGlobalConverters_SHARED,
// } from "@r2-shared-js/init-globals";
// import { EPUBis, isEPUBlication } from "@r2-shared-js/parser/epub";

// import { MAX_PREFETCH_LINKS, Server } from "./server";

// import { Transformers } from "@r2-shared-js/transform/transformer";
// import { TransformerLCPRaw } from "../utils/transformer-lcp-raw";

// // import * as filehound from "filehound";

// initGlobalConverters_OPDS();
// initGlobalConverters_SHARED();
// initGlobalConverters_GENERIC();

// Transformers.instance().add(new TransformerLCPRaw());

// setLcpNativePluginPath(path.join(process.cwd(), "LCP", "lcp.node"));

// const debug = debug_("r2:streamer#http/server-cli");

// debug(`process.cwd(): ${process.cwd()}`);
// debug(`__dirname: ${__dirname}`);

// const args = process.argv.slice(2);
// debug("process.argv.slice(2): %o", args);

// if (!args[0]) {
//     debug("FILEPATH ARGUMENT IS MISSING.");
//     process.exit(1);
// }

// const argPath = args[0].trim();
// let filePath = argPath;
// debug(`path: ${filePath}`);

// if (!fs.existsSync(filePath)) {
//     filePath = path.join(__dirname, argPath);
//     debug(`path: ${filePath}`);

//     if (!fs.existsSync(filePath)) {
//         filePath = path.join(process.cwd(), argPath);
//         debug(`path: ${filePath}`);

//         if (!fs.existsSync(filePath)) {
//             debug("FILEPATH DOES NOT EXIST.");
//             process.exit(1);
//         }
//     }
// }

// filePath = fs.realpathSync(filePath);
// debug(`path (normalized): ${filePath}`);

// const stats = fs.lstatSync(filePath);

// if (!stats.isFile() && !stats.isDirectory()) {
//     debug("FILEPATH MUST BE FILE OR DIRECTORY.");
//     process.exit(1);
// }

// let maxPrefetchLinks = MAX_PREFETCH_LINKS;
// if (args[1]) {
//     args[1] = args[1].trim();
//     if (args[1].length && args[1][0] === "-") {
//         maxPrefetchLinks = -1;
//     } else {
//         try {
//             maxPrefetchLinks = parseInt(args[1], 10);
//         } catch (err) {
//             debug(err);
//         }
//         if (isNaN(maxPrefetchLinks)) {
//             maxPrefetchLinks = MAX_PREFETCH_LINKS;
//         }
//     }
// }
// debug(`maxPrefetchLinks: ${maxPrefetchLinks}`);

// const doWatch = process.env.STREAMER_WATCH === "1";
// const disableExpiry = process.env.STREAMER_DISABLE_EXPIRY === "1";

// const isAnEPUB = isEPUBlication(filePath);

// if (stats.isDirectory() && (isAnEPUB !== EPUBis.LocalExploded)) {
//     debug("Analysing directory...");

//     const isFileAccepted = (pubPath: string) => {
//         return /((\.epub3?)|(\.cbz)|(\.audiobook)|(\.lcpaudiobook)|(\.lcpa)|(\.divina)|(\.lcpdivina))$/i.test(pubPath)
//             ||
//             (
//             /_manifest\.json$/.test(pubPath)
//             &&
//             fs.existsSync(pubPath.replace(/_manifest\.json$/, ""))
//             );
//     };

//     // tslint:disable-next-line:no-floating-promises
//     (async () => {
//         // const files: string[] = await filehound.create()
//         //     .discard("node_modules")
//         //     .depth(5)
//         //     .paths(filePath)
//         //     .ext([".epub", ".epub3", ".cbz", ".audiobook", ".lcpaudiobook", ".lcpa", ".divina", ".lcpdivina"])
//         //     .find();
//         const files = fs.readdirSync(filePath, { withFileTypes: true })
//             .filter((f) => f.isFile())
//             .map((f) => path.join(filePath, f.name))
//             .filter((pubPath) => {
//                 return isFileAccepted(pubPath);
//             });

//         const server = new Server({
//             maxPrefetchLinks,
//             enableSignedExpiry: !disableExpiry,
//         });
//         server.preventRobots();
//         server.addPublications(files);
//         const url = await server.start(0, false);
//         debug(url);

//         if (!doWatch) {
//             return;
//         }
//         debug("WATCHER: ", filePath);

//         // const watcherSubscription =
//         await watcher.subscribe(filePath, (err, events) => {

//             if (err) {
//                 debug("WATCHER: ", filePath, err);
//                 return;
//             }

//             // Can be used for temporarily pausing the watch action
//             const doWatchLive = process.env.STREAMER_WATCH === "1";
//             if (!doWatchLive) {
//                 return;
//             }

//             const filesToAdd: string[] = [];
//             const filesToRemove: string[] = [];

//             for (const event of events) {
//                 const fPath = event.path;
//                 debug(`WATCHER: ${fPath} => ${event.type}`);

//                 const fsStat = event.type === "delete" ? undefined : fs.lstatSync(fPath);
//                 if (fsStat && !fsStat.isFile()) {
//                     continue;
//                 }
//                 if (!isFileAccepted(fPath)) {
//                     continue;
//                 }

//                 if (event.type === "create") {
//                     filesToAdd.push(fPath);

//                     if (!/_manifest\.json$/.test(fPath)) {
//                         const s = `${fPath}_manifest.json`;
//                         if (fs.existsSync(s)) {
//                             if (!server.getPublications().includes(s) && !filesToAdd.includes(s)) {
//                                 filesToAdd.push(s);
//                             }
//                         }
//                     }
//                 } else if (event.type === "update") {
//                     if (!filesToRemove.includes(fPath)) {
//                         filesToRemove.push(fPath);
//                     }
//                     if (!filesToAdd.includes(fPath)) {
//                         filesToAdd.push(fPath);
//                     }
//                 } else if (event.type === "delete") {
//                     filesToRemove.push(fPath);

//                     if (!/_manifest\.json$/.test(fPath)) {
//                         const s = `${fPath}_manifest.json`;
//                         // fs.existsSync(s)
//                         if (server.getPublications().includes(s) && !filesToRemove.includes(s)) {
//                             filesToRemove.push(s);
//                         }
//                     }
//                 }
//             }

//             for (const event of events) {
//                 const fPath = event.path;

//                 const fsStat = event.type === "delete" ? undefined : fs.lstatSync(fPath);
//                 if (fsStat && !fsStat.isFile()) {
//                     continue;
//                 }
//                 if (!(
//                     /\.userkey$/.test(fPath)
//                     &&
//                     fs.existsSync(fPath.replace(/\.userkey$/, ""))
//                     )
//                 ) {
//                     continue;
//                 }
//                 const fPath_ = fPath.replace(/\.userkey$/, "");

//                 if (server.getPublications().includes(fPath_) &&
//                     (event.type === "create" || event.type === "update" || event.type === "delete")) {
//                     if (!filesToRemove.includes(fPath_)) {
//                         filesToRemove.push(fPath_);
//                     }
//                     if (!filesToAdd.includes(fPath_)) {
//                         filesToAdd.push(fPath_);
//                     }
//                 }
//             }

//             for (const event of events) {
//                 const fPath = event.path;

//                 const fsStat = event.type === "delete" ? undefined : fs.lstatSync(fPath);
//                 if (fsStat && !fsStat.isFile()) {
//                     continue;
//                 }
//                 if (!(
//                     /\.contentkey$/.test(fPath)
//                     &&
//                     fs.existsSync(fPath.replace(/\.contentkey$/, ""))
//                     )
//                 ) {
//                     continue;
//                 }
//                 const fPath_ = fPath.replace(/\.contentkey$/, "");

//                 if (server.getPublications().includes(fPath_) &&
//                     (event.type === "create" || event.type === "update" || event.type === "delete")) {
//                     if (!filesToRemove.includes(fPath_)) {
//                         filesToRemove.push(fPath_);
//                     }
//                     if (!filesToAdd.includes(fPath_)) {
//                         filesToAdd.push(fPath_);
//                     }
//                 }
//             }

//             try {

//                 debug("WATCHER: REMOVE => ", filesToRemove);
//                 server.removePublications(filesToRemove); // performs cache invalidation (if was loaded already) and removes from pub registry

//                 debug("WATCHER: ADD => ", filesToAdd);
//                 server.addPublications(filesToAdd); // does not add to cache (it's lazy)

//             } catch (ex) {
//                 debug("WATCHER: ", ex);
//             }
//         });
//         // await watcherSubscription.unsubscribe();
//     })();

//     // filePaths = fs.readdirSync(filePath);

//     // filePaths = filePaths.filter((filep) => {
//     //     const fileName = path.basename(filep);
//     //     const ext = path.extname(fileName);
//     //     return (/((\.epub3?)|(\.cbz))$/i.test(ext)) &&
//     //         fs.lstatSync(path.join(filePath, filep)).isFile();
//     // });

//     // filePaths = filePaths.map((filep) => {
//     //     return path.join(filePath, filep);
//     // });

//     // debug("Publications:");
//     // filePaths.forEach((filep) => {
//     //     debug(filep);
//     // });
// } else {
//     // tslint:disable-next-line:no-floating-promises
//     (async () => {
//         const server = new Server({
//             maxPrefetchLinks,
//             enableSignedExpiry: !disableExpiry,
//         });
//         server.preventRobots();
//         server.addPublications([filePath]);
//         const url = await server.start(0, false);
//         debug(url);
//     })();
// }
