// // ==LICENSE-BEGIN==
// // Copyright 2017 European Digital Reading Lab. All rights reserved.
// // Licensed to the Readium Foundation under one or more contributor license agreements.
// // Use of this source code is governed by a BSD-style license
// // that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// // ==LICENSE-END==

// import * as child_process from "child_process";
// import debug_ from "debug";
// import * as express from "express";
// import * as fs from "fs";
// import * as http from "http";
// import * as https from "https";
// import * as path from "path";
// import { tmpNameSync } from "tmp";

// import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
// import { OPDSFeed } from "@r2-opds-js/opds/opds2/opds2";
// import { Publication } from "@r2-shared-js/models/publication";
// import { PublicationParsePromise } from "@r2-shared-js/parser/publication-parser";
// import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";
// import { zipLoadPromise } from "@r2-utils-js/_utils/zip/zipFactory";

// import { CertificateData, generateSelfSignedData } from "../utils/self-signed";
// import { serverAssets } from "./server-assets";
// import { serverLCPLSD_show } from "./server-lcp-lsd-show";
// import { serverManifestJson } from "./server-manifestjson";
// import { serverMediaOverlays } from "./server-mediaoverlays";
// import { serverOPDS_browse_v1 } from "./server-opds-browse-v1";
// import { serverOPDS_browse_v2 } from "./server-opds-browse-v2";
// import { serverOPDS_convert_v1_to_v2 } from "./server-opds-convert-v1-to-v2";
// import { serverOPDS_local_feed } from "./server-opds-local-feed";
// import { serverPub } from "./server-pub";
// import { serverRoot } from "./server-root";
// import { IHTTPHeaderNameValue, serverSecure, serverSecureHTTPHeader } from "./server-secure";
// import { serverRemotePub } from "./server-url";
// import { serverVersion } from "./server-version";

// // import { LCP } from "@r2-lcp-js/parser/epub/lcp";

// const debug = debug_("r2:streamer#http/server");

// const isValidHexPassphraseHashSha256 = (str: string): boolean => {
//     if (str.length !== 64) { // 32 bytes
//         return false;
//     }
//     let isHex = true;
//     for (let i = 0; i < str.length; i += 2) {
//         const hexByte = str.substr(i, 2).toLowerCase();
//         // normally [0-9a-fA-F], but we normalise with .toLowerCase() above
//         if (!/^[0-9a-f][0-9a-f]$/.test(hexByte)) {
//             isHex = false;
//             break;
//         }
//         const parsedInt = parseInt(hexByte, 16);
//         // debug(hexByte, parsedInt);
//         if (isNaN(parsedInt)) {
//             isHex = false;
//             break;
//         }
//     }
//     return isHex;
// };

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// interface IPathPublicationMap { [key: string]: any; }

// export interface ServerData extends CertificateData {
//     urlScheme: string;
//     urlHost: string;
//     urlPort: number;
// }

// export interface IServerOptions {
//     disableReaders?: boolean;
//     disableDecryption?: boolean; /* excludes obfuscated fonts */
//     disableRemotePubUrl?: boolean;
//     disableOPDS?: boolean;
//     enableSignedExpiry?: boolean;
//     maxPrefetchLinks?: number;
// }

// // this ceiling value seems very arbitrary ... what would be a reasonable default value?
// // ... based on what metric, any particular HTTP server or client implementation?
// export const MAX_PREFETCH_LINKS = 10;

// export class Server {
//     public readonly disableReaders: boolean;
//     public readonly disableDecryption: boolean;
//     public readonly disableRemotePubUrl: boolean;
//     public readonly disableOPDS: boolean;
//     public readonly enableSignedExpiry: boolean;
//     public readonly maxPrefetchLinks: number;

//     public readonly lcpBeginToken = "*-";
//     public readonly lcpEndToken = "-*";

//     private readonly publications: string[];
//     private publicationsOPDSfeed: OPDSFeed | undefined;
//     private publicationsOPDSfeedNeedsUpdate: boolean;
//     private readonly pathPublicationMap: IPathPublicationMap;
//     private creatingPublicationsOPDS: boolean;
//     private readonly opdsJsonFilePath: string;

//     private readonly expressApp: express.Application;

//     private httpServer: http.Server | undefined;
//     private httpsServer: https.Server | undefined;

//     private serverData: ServerData | undefined;

//     constructor(options?: IServerOptions) {

//         this.disableReaders = !!(options?.disableReaders);
//         this.disableDecryption = !!(options?.disableDecryption);
//         this.disableRemotePubUrl = !!(options?.disableRemotePubUrl);
//         this.disableOPDS = !!(options?.disableOPDS);
//         this.enableSignedExpiry = !!(options?.enableSignedExpiry);

//         // note: zero not allowed (fallback to default MAX_PREFETCH_LINKS). use -1 to disable ceiling value.
//         this.maxPrefetchLinks = options?.maxPrefetchLinks ? options.maxPrefetchLinks : MAX_PREFETCH_LINKS;

//         this.publications = [];
//         this.pathPublicationMap = {};
//         this.publicationsOPDSfeed = undefined;
//         this.publicationsOPDSfeedNeedsUpdate = true;
//         this.creatingPublicationsOPDS = false;

//         this.opdsJsonFilePath = tmpNameSync({ prefix: "readium2-OPDS2-", postfix: ".json" });

//         this.expressApp = express();
//         // this.expressApp.enable('strict routing');

//         serverSecure(this, this.expressApp);

//         // https://expressjs.com/en/4x/api.html#express.static
//         const staticOptions = {
//             etag: false,
//         };
//         if (!this.disableReaders) {
//             this.expressApp.use("/readerNYPL", express.static("misc/readers/reader-NYPL", staticOptions));
//             this.expressApp.use("/readerHADRIEN", express.static("misc/readers/reader-HADRIEN", staticOptions));
//         }

//         serverRoot(this, this.expressApp);
//         serverVersion(this, this.expressApp);

//         if (!this.disableRemotePubUrl) {
//             serverRemotePub(this, this.expressApp);
//             serverLCPLSD_show(this, this.expressApp);
//         }
//         if (!this.disableOPDS) {
//             serverOPDS_browse_v1(this, this.expressApp);
//             serverOPDS_browse_v2(this, this.expressApp);
//             serverOPDS_local_feed(this, this.expressApp);
//             serverOPDS_convert_v1_to_v2(this, this.expressApp);
//         }

//         const routerPathBase64: express.Router = serverPub(this, this.expressApp);
//         serverManifestJson(this, routerPathBase64);
//         serverMediaOverlays(this, routerPathBase64);
//         serverAssets(this, routerPathBase64);
//     }

//     // TODO: HTTP header `X-Robots-Tag` === `none`?
//     public preventRobots() {
//         this.expressApp.get("/robots.txt", (_req: express.Request, res: express.Response) => {

//             const robotsTxt = `User-agent: *
// Disallow: /
// `;
//             res.header("Content-Type", "text/plain");
//             res.status(200).send(robotsTxt);
//         });
//     }

//     public expressUse(pathf: string, func: express.Handler) {
//         this.expressApp.use(pathf, func);
//     }

//     public expressGet(paths: string[], func: express.Handler) {
//         this.expressApp.get(paths, func);
//     }

//     public isStarted(): boolean {
//         return (typeof this.serverInfo() !== "undefined") &&
//             (typeof this.httpServer !== "undefined") ||
//             (typeof this.httpsServer !== "undefined");
//     }

//     public isSecured(): boolean {
//         return (typeof this.serverInfo() !== "undefined") &&
//             (typeof this.httpsServer !== "undefined");
//     }

//     public getSecureHTTPHeader(url: string): IHTTPHeaderNameValue | undefined {
//         return serverSecureHTTPHeader(this, url);
//     }

//     public async start(port: number, secure: boolean): Promise<ServerData> {

//         if (this.isStarted()) {
//             return Promise.resolve(this.serverInfo() as ServerData);
//         }

//         let envPort = 0;
//         try {
//             envPort = process.env.PORT ? parseInt(process.env.PORT as string, 10) : 0;
//         } catch (err) {
//             debug(err);
//             envPort = 0;
//         }
//         const p = port || envPort || 3000;
//         debug(`PORT: ${port} || ${envPort} || 3000 => ${p}`);

//         if (secure) {
//             this.httpServer = undefined;

//             return new Promise<ServerData>(async (resolve, reject) => {
//                 let certData: CertificateData | undefined;
//                 try {
//                     certData = await generateSelfSignedData();
//                 } catch (err) {
//                     debug(err);
//                     // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
//                     reject("err");
//                     return;
//                 }

//                 this.httpsServer = https.createServer({ key: certData.private, cert: certData.cert },
//                     this.expressApp).listen(p, () => {

//                         this.serverData = {
//                             ...certData,
//                             urlHost: "127.0.0.1",
//                             urlPort: p, // this.httpsServer.address().port
//                             urlScheme: "https",
//                         } as ServerData;
//                         resolve(this.serverData);
//                     });
//             });
//         } else {
//             this.httpsServer = undefined;

//             return new Promise<ServerData>((resolve, _reject) => {
//                 this.httpServer = http.createServer(this.expressApp).listen(p, () => {

//                     this.serverData = {
//                         urlHost: "127.0.0.1",
//                         urlPort: p, // this.httpsServer.address().port
//                         urlScheme: "http",
//                     } as ServerData;
//                     resolve(this.serverData);
//                 });
//                 // this.httpServer = this.expressApp.listen(p, () => {
//                 //     debug(`http://localhost:${p}`);
//                 // });
//             });
//         }
//     }

//     public stop() {
//         if (this.isStarted()) {
//             if (this.httpServer) {
//                 this.httpServer.close();
//                 this.httpServer = undefined;
//             }
//             if (this.httpsServer) {
//                 this.httpsServer.close();
//                 this.httpsServer = undefined;
//             }
//             this.serverData = undefined;
//             this.uncachePublications();
//         }
//     }

//     public serverInfo(): ServerData | undefined {
//         return this.serverData;
//     }

//     public serverUrl(): string | undefined {
//         if (!this.isStarted()) {
//             return undefined;
//         }
//         const info = this.serverInfo();
//         if (!info) {
//             return undefined;
//         }

//         // This is important, because browsers collapse the standard HTTP and HTTPS ports,
//         // and we don't normalise this elsewhere in consumer code!
//         // (which means critical URL prefix matching / syntax comparisons would fail otherwise :(
//         if (info.urlPort === 443 || info.urlPort === 80) {
//             return `${info.urlScheme}://${info.urlHost}`;
//         }
//         return `${info.urlScheme}://${info.urlHost}:${info.urlPort}`;

//         // const port = this.httpServer ? this.httpServer.address().port :
//         //     (this.httpsServer ? this.httpsServer.address().port : 0);
//         // return this.isStarted() ?
//         //     `${this.httpsServer ? "https:" : "http:"}//127.0.0.1:${port}` :
//         //     undefined;
//     }

//     public setResponseCacheHeaders(res: express.Response, enableCaching: boolean) {

//         if (enableCaching) {
//             res.setHeader("Cache-Control", "public,max-age=86400");
//         } else {
//             res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
//             res.setHeader("Pragma", "no-cache");
//             res.setHeader("Expires", "0");
//         }
//     }

//     public setResponseCORS(res: express.Response) {
//         res.setHeader("Access-Control-Allow-Origin",
//             "*");

//         res.setHeader("Access-Control-Allow-Methods",
//             "GET, HEAD, OPTIONS"); // POST, DELETE, PUT, PATCH

//         res.setHeader("Access-Control-Allow-Headers",
//             // tslint:disable-next-line:max-line-length
//             "Content-Type, Content-Length, Accept-Ranges, Content-Range, Range, Link, Transfer-Encoding, X-Requested-With, Authorization, Accept, Origin, User-Agent, DNT, Cache-Control, Keep-Alive, If-Modified-Since");

//         res.setHeader("Access-Control-Expose-Headers",
//             // tslint:disable-next-line:max-line-length
//             "Content-Type, Content-Length, Accept-Ranges, Content-Range, Range, Link, Transfer-Encoding, X-Requested-With, Authorization, Accept, Origin, User-Agent, DNT, Cache-Control, Keep-Alive, If-Modified-Since");
//     }

//     public addPublications(pubs: string[]): string[] {
//         pubs.forEach((pub) => {
//             if (this.publications.indexOf(pub) < 0) {
//                 this.publicationsOPDSfeedNeedsUpdate = true;
//                 this.publications.push(pub);
//             }
//         });

//         return pubs.map((pub) => {
//             const pubid = encodeURIComponent_RFC3986(Buffer.from(pub).toString("base64"));
//             return `/pub/${pubid}/manifest.json`;
//         });
//     }

//     public removePublications(pubs: string[]): string[] {
//         pubs.forEach((pub) => {
//             this.uncachePublication(pub);
//             const i = this.publications.indexOf(pub);
//             if (i >= 0) {
//                 this.publicationsOPDSfeedNeedsUpdate = true;
//                 this.publications.splice(i, 1);
//             }
//         });

//         return pubs.map((pub) => {
//             const pubid = encodeURIComponent_RFC3986(Buffer.from(pub).toString("base64"));
//             return `/pub/${pubid}/manifest.json`;
//         });
//     }

//     public getPublications(): string[] {
//         return this.publications;
//     }

//     public async loadOrGetCachedPublication(filePath: string): Promise<Publication> {

//         let publication = this.cachedPublication(filePath);
//         if (!publication) {

//             // const fileName = path.basename(pathBase64Str);
//             // const ext = path.extname(fileName);

//             if (filePath.endsWith("_manifest.json")) {
//                 try {
//                     const zip = await zipLoadPromise(filePath.replace(/_manifest\.json$/, ""));
//                     const publicationJsonStr = fs.readFileSync(filePath, { encoding: "utf8" });
//                     const publicationJsonObj = global.JSON.parse(publicationJsonStr);

//                     publication = TaJsonDeserialize(publicationJsonObj, Publication);

//                     publication.AddToInternal("filename", path.basename(filePath));

//                     publication.AddToInternal("type", "daisy");
//                     publication.AddToInternal("zip", zip);
//                 } catch (err) {
//                     debug(err);
//                     // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
//                     return Promise.reject(err);
//                 }
//             } else {
//                 try {
//                     publication = await PublicationParsePromise(filePath);
//                 } catch (err) {
//                     debug(err);
//                     // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
//                     return Promise.reject(err);
//                 }
//             }

//             if (!publication) {
//                 // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
//                 return Promise.reject("!PUBLICATION??");
//             }

//             if (!publication.LCP && !this.disableDecryption) {
//                 try {
//                     const contentKeys: string[] = [];

//                     const contentKeyPath = path.join(path.dirname(filePath), path.basename(filePath) + ".contentkey");
//                     if (fs.existsSync(contentKeyPath)) {
//                         let contentKey = fs.readFileSync(contentKeyPath, { encoding: "utf8" });
//                         if (contentKey) {
//                             contentKey = contentKey.trim();
//                             // AES-256-CBC also 32 bytes / 64 hex chars arranged in pairs
//                             if (isValidHexPassphraseHashSha256(contentKey)) {
//                                 contentKeys.push(contentKey);
//                             }
//                         }
//                     }
//                     const lcpContentKeysPath = path.join(process.cwd(), "LCP", ".contentkeys");
//                     if (fs.existsSync(lcpContentKeysPath)) {
//                         let contentKeysData = fs.readFileSync(lcpContentKeysPath, { encoding: "utf8" });
//                         if (contentKeysData) {
//                             contentKeysData = contentKeysData.trim();
//                             const contentKeysMap = contentKeysData.split("\n").map((contentKeyLine) => {
//                                 contentKeyLine = contentKeyLine.trim();
//                                 if (!contentKeyLine) {
//                                     return null;
//                                 }
//                                 const keyValuePair = contentKeyLine.split("_::_");
//                                 if (keyValuePair[0] && keyValuePair[1]) {
//                                     return [keyValuePair[0].trim(), keyValuePair[1].trim()];
//                                 }
//                                 return null;
//                             }).filter((item) => !!item);
//                             for (const keyValuePair of contentKeysMap) {
//                                 const key = keyValuePair[0];
//                                 const value = keyValuePair[1];
//                                 if (key === path.relative(process.cwd(), filePath)) {
//                                     if (isValidHexPassphraseHashSha256(value)) {
//                                         contentKeys.push(value);
//                                     }
//                                 }
//                             }
//                         }
//                     }

//                     const contentKeysUnique = Array.from(new Set(contentKeys));

//                     debug("SUCCESS contentKeys:");
//                     debug(filePath);
//                     debug(path.relative(process.cwd(), filePath));
//                     debug(contentKeys.length);
//                     debug(contentKeysUnique.length);
//                     // debug(contentKeys);
//                     // debug(contentKeysUnique);

//                     if (contentKeysUnique.length) {
//                         // debug(contentKeysUnique[0]);

//                         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//                         (publication as any)["AES256CBCContentKey"] = Buffer.from(contentKeysUnique[0], "hex");
//                     }

//                 } catch (err) {
//                     debug(err);
//                     const errMsg = "FAIL AES256CBCContentKey: " + err;
//                     debug(errMsg);
//                 }
//             }

//             if (publication.LCP && !this.disableDecryption) {
//                 try {
//                     const userKeys: string[] = [];

//                     const lcpUserKeyPath = path.join(path.dirname(filePath), path.basename(filePath) + ".userkey");
//                     if (fs.existsSync(lcpUserKeyPath)) {
//                         let userKey = fs.readFileSync(lcpUserKeyPath, { encoding: "utf8" });
//                         if (userKey) {
//                             userKey = userKey.trim();
//                             if (isValidHexPassphraseHashSha256(userKey)) {
//                                 userKeys.push(userKey);
//                             }
//                         }
//                     }
//                     const lcpUserKeysPath = path.join(process.cwd(), "LCP", ".userkeys");
//                     if (fs.existsSync(lcpUserKeysPath)) {
//                         let userKeysData = fs.readFileSync(lcpUserKeysPath, { encoding: "utf8" });
//                         if (userKeysData) {
//                             userKeysData = userKeysData.trim();
//                             const userKeysMap = userKeysData.split("\n").map((userKeyLine) => {
//                                 userKeyLine = userKeyLine.trim();
//                                 if (!userKeyLine) {
//                                     return null;
//                                 }
//                                 const keyValuePair = userKeyLine.split("_::_");
//                                 if (keyValuePair[0] && keyValuePair[1]) {
//                                     return [keyValuePair[0].trim(), keyValuePair[1].trim()];
//                                 }
//                                 return null;
//                             }).filter((item) => !!item);
//                             for (const keyValuePair of userKeysMap) {
//                                 const key = keyValuePair[0];
//                                 const value = keyValuePair[1];
//                                 if (key === publication.LCP.Provider || key === publication.LCP.ID) {
//                                     if (isValidHexPassphraseHashSha256(value)) {
//                                         userKeys.push(value);
//                                     }
//                                 }
//                             }
//                         }
//                     }

//                     const userKeysUnique = Array.from(new Set(userKeys));
//                     try {
//                         await publication.LCP.tryUserKeys(userKeysUnique); // hex

//                         debug("SUCCESS publication.LCP.tryUserKeys():");
//                         debug(filePath);
//                         debug(publication.LCP.Provider);
//                         debug(publication.LCP.ID);
//                         debug(userKeys.length);
//                         debug(userKeysUnique.length);
//                         // debug(userKeys);
//                         // debug(userKeysUnique);
//                         if (publication.LCP.ContentKey) { // LCP basic profile only, Javascript implementation (otherwise opaque native lib)
//                             debug(publication.LCP.ContentKey.toString("hex"));
//                         }
//                         // example LCP basic profile /misc/epubs/wasteland-otf-obf_LCP_dan.lcpl
//                         // publication.LCP.ContentKey ===> 4a297afd457fa9caf9d1ad20a2b59cd1ac61b4d9792add9f8f032cf1775798b3
//                         // (passphrase "dan", SHA256 userkey "ec4f2dbb3b140095550c9afbbb69b5d6fd9e814b9da82fad0b34e9fcbe56f1cb")
//                         // license JSON "content_key":
//                         // =================
//                         // const encrypted = Buffer.from("YGlj0vldEzpiBYojGSaw7iSlXQ6PlXJv5gkD/+jRdloeekilc9B9CSKWf1n70s0lE1qeVJrZFZY6DsyyKZn4bQ==", "base64");
//                         // const decrypteds = [];
//                         // const key = Buffer.from("ec4f2dbb3b140095550c9afbbb69b5d6fd9e814b9da82fad0b34e9fcbe56f1cb", "hex");
//                         // const decryptStream = require("crypto").createDecipheriv("aes-256-cbc", key, encrypted.slice(0, 16));
//                         // decryptStream.setAutoPadding(false);
//                         // const enc = encrypted.slice(16, encrypted.lenth);
//                         // const buff1 = decryptStream.update(enc);
//                         // if (buff1) {
//                         //     decrypteds.push(buff1);
//                         // }
//                         // const buff2 = decryptStream.final();
//                         // if (buff2) {
//                         //     decrypteds.push(buff2);
//                         // }
//                         // const decrypted = Buffer.concat(decrypteds);
//                         // const nPaddingBytes = decrypted[decrypted.length - 1];
//                         // const size = enc.length - nPaddingBytes;
//                         // const decryptedStr = decrypted.slice(0, size).toString("hex");
//                         // console.log(decryptedStr);
//                         // =================
//                         // ==> "4a297afd457fa9caf9d1ad20a2b59cd1ac61b4d9792add9f8f032cf1775798b3"
//                     } catch (err) {
//                         publication.LCP.ContentKey = undefined;
//                         debug(err);
//                         const errMsg = "FAIL publication.LCP.tryUserKeys(): " + err;
//                         debug(errMsg);
//                     }
//                 } catch (err) {
//                     publication.LCP.ContentKey = undefined;
//                     debug(err);
//                     const errMsg = "FAIL before publication.LCP.tryUserKeys(): " + err;
//                     debug(errMsg);
//                 }
//             }

//             this.cachePublication(filePath, publication);
//         }
//         // return Promise.resolve(publication);
//         return publication;
//     }

//     public isPublicationCached(filePath: string): boolean {
//         return typeof this.cachedPublication(filePath) !== "undefined";
//     }

//     public cachedPublication(filePath: string): Publication | undefined {
//         return this.pathPublicationMap[filePath];
//     }

//     public cachePublication(filePath: string, pub: Publication) {
//         // TODO: implement LRU caching algorithm? Anything smarter than this will do!
//         if (!this.isPublicationCached(filePath)) {
//             this.pathPublicationMap[filePath] = pub;
//         }
//     }

//     public uncachePublication(filePath: string) {
//         if (this.isPublicationCached(filePath)) {
//             const pub = this.cachedPublication(filePath);
//             if (pub) {
//                 try {
//                     pub.freeDestroy();
//                 } catch (ex) {
//                     debug(ex);
//                 }
//             }
//             this.pathPublicationMap[filePath] = undefined;
//             delete this.pathPublicationMap[filePath];
//         }
//     }

//     public uncachePublications() {
//         Object.keys(this.pathPublicationMap).forEach((filePath) => {
//             this.uncachePublication(filePath);
//         });
//     }

//     public publicationsOPDS(): OPDSFeed | undefined {

//         if (this.publicationsOPDSfeedNeedsUpdate) {
//             this.publicationsOPDSfeed = undefined;
//             if (fs.existsSync(this.opdsJsonFilePath)) {
//                 fs.unlinkSync(this.opdsJsonFilePath);
//             }
//         }

//         if (this.publicationsOPDSfeed) {
//             return this.publicationsOPDSfeed;
//         }

//         debug(`OPDS2.json => ${this.opdsJsonFilePath}`);
//         if (!fs.existsSync(this.opdsJsonFilePath)) {
//             if (!this.creatingPublicationsOPDS) {
//                 this.creatingPublicationsOPDS = true;

//                 this.publicationsOPDSfeedNeedsUpdate = false;

//                 const jsFile = path.join(__dirname, "opds2-create-cli.js");
//                 const args = [jsFile, this.opdsJsonFilePath];
//                 this.publications.forEach((pub) => {
//                     const filePathBase64 = encodeURIComponent_RFC3986(Buffer.from(pub).toString("base64"));
//                     args.push(filePathBase64);
//                 });
//                 // debug("SPAWN OPDS2 create: %o", args);
//                 debug(`SPAWN OPDS2-create: ${args[0]}`);

//                 const child = child_process.spawn("node", args, {
//                     cwd: process.cwd(),
//                     // detached: true,
//                     env: process.env,
//                     // stdio: ["ignore"],
//                 })
//                     // .unref()
//                     ;
//                 child.stdout.on("data", (data) => {
//                     debug(data.toString());
//                 });
//                 child.stderr.on("data", (data) => {
//                     debug(data.toString());
//                 });
//             }
//             return undefined;
//         }
//         this.creatingPublicationsOPDS = false;
//         const jsonStr = fs.readFileSync(this.opdsJsonFilePath, { encoding: "utf8" });
//         if (!jsonStr) {
//             return undefined;
//         }
//         const json = global.JSON.parse(jsonStr);

//         this.publicationsOPDSfeed = TaJsonDeserialize<OPDSFeed>(json, OPDSFeed);
//         return this.publicationsOPDSfeed;
//     }
// }
