// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import * as fs from "fs";
import * as http from "http";
import * as https from "https";
import * as path from "path";

import { Publication } from "@r2-shared-js/models/publication";
import { LCP } from "@r2-lcp-js/parser/epub/lcp";
import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import { isHTTP } from "@r2-utils-js/_utils/http/UrlUtils";
import { traverseJsonObjects } from "@r2-utils-js/_utils/JsonUtils";
import { streamToBufferPromise } from "@r2-utils-js/_utils/stream/BufferUtils";
import { IStreamAndLength, IZip } from "@r2-utils-js/_utils/zip/zip";
import { zipLoadPromise } from "@r2-utils-js/_utils/zip/zipFactory";

import { zipHasEntry } from "../_utils/zipHasEntry";

const debug = debug_("r2:shared#parser/divina");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function absolutizeURLs(rootUrl: string, jsonObj: any) {
    traverseJsonObjects(jsonObj,
        (obj) => {
            if (obj.href && typeof obj.href === "string"
                && !isHTTP(obj.href)) {
                // obj.href_ = obj.href;
                obj.href = rootUrl + "/" + obj.href;
            }
        });
}

// tslint:disable-next-line:max-line-length
export async function DivinaParsePromise(filePath: string, isDivina?: Divinais, pubtype?: string): Promise<Publication> {

    const isAnDivina = isDivina || await isDivinaPublication(filePath);

    const publicationType = pubtype || (isAnDivina ? "divina" : "generic");

    // // excludes Divinais.RemoteExploded
    // const canLoad = isAnDivina === Divinais.LocalExploded ||
    //     isAnDivina === Divinais.LocalPacked ||
    //     isAnDivina === Divinais.RemotePacked;
    // if (!canLoad) {
    //     // TODO? r2-utils-js zip-ext.ts => variant for HTTP without directory listing? (no deterministic zip entries)
    //     const err = "Cannot load exploded remote EPUB (needs filesystem access to list directory contents).";
    //     debug(err);
    //     // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
    //     return Promise.reject(err);
    // }

    let entryName = "manifest.json";

    let filePathToLoad = filePath;
    if (isAnDivina === Divinais.LocalExploded) { // (must ensure is directory/folder)
        filePathToLoad = path.dirname(filePathToLoad) + "/";
    } else if (isAnDivina === Divinais.RemoteExploded) {
        const url = new URL(filePathToLoad);
        entryName = path.basename(url.pathname);
        url.pathname = path.dirname(url.pathname) + "/";

        // contains trailing slash
        filePathToLoad = url.toString();
    }

    let zip: IZip;
    try {
        zip = await zipLoadPromise(filePathToLoad);
    } catch (err) {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject(err);
    }

    if (!zip.hasEntries()) {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject("Divina zip empty");
    }
    if (isAnDivina === Divinais.LocalExploded ||
        isAnDivina === Divinais.LocalPacked) {

        const has = await zipHasEntry(zip, entryName, undefined);
        if (!has) {
            const zipEntries = await zip.getEntries();
            for (const zipEntry of zipEntries) {
                if (zipEntry.startsWith("__MACOSX/")) {
                    continue;
                }
                debug(zipEntry);
            }
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            return Promise.reject("Divina no manifest?!");
        }
    }

    // let entries: string[];
    // try {
    //     entries = await zip.getEntries();
    // } catch (err) {
    //     console.log(err);
    //     // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
    //     return Promise.reject("Problem getting Divina zip entries");
    // }
    // for (const entryName of entries) {
    //     // debug("++ZIP: entry");
    //     // debug(entryName);

    //     if (entryName === "manifest.json") {
    //         // import { tryDecodeURI } from "../_utils/decodeURI";
    //         // const entryNameDecoded = tryDecodeURI(entryName);
    //         // if (!entryNameDecoded) {
    //         //     return Promise.reject(`Cannot decode URI?! ${entryName}`);
    //         // }
    //     }
    // }

    let manifestZipStream_: IStreamAndLength;
    try {
        manifestZipStream_ = await zip.entryStreamPromise(entryName);
    } catch (err) {
        debug(err);
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject(`Problem streaming Divina zip entry?! ${entryName}`);
    }
    const manifestZipStream = manifestZipStream_.stream;
    let manifestZipData: Buffer;
    try {
        manifestZipData = await streamToBufferPromise(manifestZipStream);
    } catch (err) {
        debug(err);
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject(`Problem buffering Divina zip entry?! ${entryName}`);
    }

    const manifestJsonStr = manifestZipData.toString("utf8");
    const manifestJson = JSON.parse(manifestJsonStr);

    if (isAnDivina === Divinais.RemoteExploded) {
        const url = new URL(filePath);
        url.pathname = path.dirname(url.pathname);
        absolutizeURLs(url.toString(), manifestJson);
    }

    const publication = TaJsonDeserialize<Publication>(manifestJson, Publication);

    publication.AddToInternal("type", publicationType);
    publication.AddToInternal("zip", zip);

    const lcpEntryName = "license.lcpl";
    let checkLCP = true; // allows isAnDivina === Divinais.RemoteExploded
    let hasLCP = false; // only if zipHasEntry() verifies presence of lcpEntryName (Divinais.LocalExploded|Packed)
    if (isAnDivina === Divinais.LocalExploded ||
        isAnDivina === Divinais.LocalPacked) {
        const has = await zipHasEntry(zip, lcpEntryName, undefined);
        if (!has) {
            checkLCP = false;
        } else {
            hasLCP = true;
        }
    }
    if (checkLCP) {
        let lcpZipStream_: IStreamAndLength | undefined;
        try {
            lcpZipStream_ = await zip.entryStreamPromise(lcpEntryName);
        } catch (err) {
            if (hasLCP) {
                debug(err);
                // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                return Promise.reject(`Problem streaming Divina LCP zip entry?! ${entryName}`);
            } else {
                debug("Divina no LCP.");
            }
            checkLCP = false;
        }
        if (checkLCP && lcpZipStream_) {
            const lcpZipStream = lcpZipStream_.stream;
            let lcpZipData: Buffer;
            try {
                lcpZipData = await streamToBufferPromise(lcpZipStream);
            } catch (err) {
                debug(err);
                // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                return Promise.reject(`Problem buffering Divina LCP zip entry?! ${entryName}`);
            }

            const lcpJsonStr = lcpZipData.toString("utf8");
            const lcpJson = JSON.parse(lcpJsonStr);

            const lcpl = TaJsonDeserialize<LCP>(lcpJson, LCP);
            lcpl.ZipPath = lcpEntryName;
            lcpl.JsonSource = lcpJsonStr;
            lcpl.init();

            publication.LCP = lcpl;
        }
    }

    return Promise.resolve(publication);
}

// https://github.com/readium/divina-player-js/blob/master/public/webtoon/manifest.json
// curl -s -L -I -X GET xxx
// Content-Type: application/divina+json; charset=utf-8
export enum Divinais {
    LocalExploded = "LocalExploded",
    LocalPacked = "LocalPacked",
    RemoteExploded = "RemoteExploded",
    RemotePacked = "RemotePacked",
}

async function doRequest(u: string): Promise<Divinais | undefined> {
    return new Promise<Divinais | undefined>((resolve, _reject) => {
        const url = new URL(u);
        const secure = url.protocol === "https:";
        const options = {
            headers: {
                "Accept": "*/*,application/divina+json",
                "Accept-Language": "en-UK,en-US;q=0.7,en;q=0.5",
                "Host": url.host,
                "User-Agent": "thorium-desktop",
            },
            host: url.host,
            method: "GET",
            path: url.pathname + url.search,
            port: secure ? 443 : 80,
            protocol: url.protocol,
        };
        debug(JSON.stringify(options));
        (secure ? https : http).request(options, (res) => {
            if (!res) {
                resolve(undefined);
                // reject(`HTTP no response ${u}`);
                return;
            }

            debug(res.statusCode);
            debug(JSON.stringify(res.headers));

            if (res.statusCode && (res.statusCode >= 300 && res.statusCode < 400)) {
                const loc = res.headers.Location || res.headers.location;
                if (loc && loc.length) {
                    const l = Array.isArray(loc) ? loc[0] : loc;
                    process.nextTick(async () => {
                        try {
                            const redirectRes = await doRequest(l);
                            resolve(redirectRes);
                        } catch (_err) {
                            resolve(undefined);
                            // reject(`HTTP Divina redirect, then fail ${u} ${err}`);
                        }
                    });
                } else {
                    resolve(undefined);
                    // reject(`HTTP Divina redirect without location?! ${u}`);
                }
                return;
            }
            const type = res.headers["Content-Type"] || res.headers["content-type"];
            if (type) {
                if (type.includes("application/divina+json")) {
                    resolve(Divinais.RemoteExploded);
                    return;
                }
                if (type.includes("application/json")) {
                    res.setEncoding("utf8");

                    let responseBody = "";
                    res.on("data", (chunk) => {
                        responseBody += chunk;
                    });
                    res.on("end", () => {
                        try {
                            const manJson = JSON.parse(responseBody);
                            if (manJson.metadata && manJson.metadata["@type"] &&
                                (/https?:\/\/schema\.org\/VisualArtwork$/.test(manJson.metadata["@type"]) ||
                                /https?:\/\/schema\.org\/ComicStory$/.test(manJson.metadata["@type"]))
                            ) {
                                resolve(Divinais.RemoteExploded);
                                return;
                            } else {
                                resolve(undefined);
                                // reject(`HTTP JSON not Divina ${u}`);
                            }
                        } catch (ex) {
                            debug(ex);
                            resolve(undefined);
                            // reject(`HTTP Divina invalid JSON?! ${u} ${ex}`);
                        }
                    });

                    return;
                }
            }
            resolve(undefined);
            // reject(`Not HTTP Divina type ${u}`);
        }).on("error", (err) => {
            debug(err);
            resolve(undefined);
            // reject(`HTTP error ${u} ${err}`);
        }).end();
    });
}

export async function isDivinaPublication(urlOrPath: string): Promise<Divinais | undefined> {
    let p = urlOrPath;
    const isHttp = isHTTP(urlOrPath);
    if (isHttp) {
        const url = new URL(urlOrPath);
        p = url.pathname;
    }

    const fileName = path.basename(p);
    const ext = path.extname(fileName);

    const dnva = /\.divina$/i.test(ext);
    const dnvaLcp = /\.lcpdivina$/i.test(ext);
    if (dnva || dnvaLcp) {
        // return isHttp ? Divinais.RemotePacked : Divinais.LocalPacked;
        if (!isHttp) {
            return Divinais.LocalPacked;
        }
    }

    if (!isHttp && fileName === "manifest.json") {
        // const manPath = fileName === "manifest.json" ? p : path.join(p, "manifest.json");
        if (fs.existsSync(p)) {
            const manStr = fs.readFileSync(p, { encoding: "utf8" });
            const manJson = JSON.parse(manStr);
            if (manJson.metadata && manJson.metadata["@type"] &&
                (/https?:\/\/schema\.org\/VisualArtwork$/.test(manJson.metadata["@type"]) ||
                /https?:\/\/schema\.org\/ComicStory$/.test(manJson.metadata["@type"]))
            ) {
                return Divinais.LocalExploded;
            }
        }
    }

    // // filePath.replace(/\//, "/").endsWith("divina/manifest.json")
    // if (/divina[\/|\\]manifest.json$/.test(p)) {
    //     return isHttp ? Divinais.RemoteExploded : Divinais.LocalExploded;
    // }

    if (isHttp) {
        return doRequest(urlOrPath);
    }

    return Promise.resolve(undefined);
    // // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
    // return Promise.reject("Cannot determine Divina type");
}
