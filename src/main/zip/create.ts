// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import * as debug_ from "debug";
import { createWriteStream, readdirSync, statSync, readFileSync, unlinkSync, renameSync } from "fs";

// TypeScript GO:
// The current file is a CommonJS module whose imports will produce 'require' calls;
// however, the referenced file is an ECMAScript module and cannot be imported with 'require'.
// Consider writing a dynamic 'import("...")' call instead.
// To convert this file to an ECMAScript module, change its file extension to '.mts',
// or add the field `"type": "module"` to 'package.json'.
// @__ts-expect-error TS1479 (with TypeScript tsc ==> TS2578: Unused '@ts-expect-error' directive)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore TS1479
import { nanoid } from "nanoid";

import * as path from "path";
import { ZipFile } from "yazl";
import { EventEmitter } from "events";

import { createTempDir } from "../fs/path";
import { extractCrc32OnZip } from "../tools/crc";
import { createSign, createVerify } from "crypto";

import { _CUSTOMIZATION_PROFILE_PRIVATE_KEY, _CUSTOMIZATION_PROFILE_PUB_KEY } from "readium-desktop/preprocessor-directives";
import { ICustomizationManifest } from "readium-desktop/common/readium/customization/manifest";
import { sanitizeForFilename } from "readium-desktop/common/safe-filename";
import { injectBufferInZip } from "../tools/zipInjector";
import { EXT_THORIUM } from "readium-desktop/common/extension";

// Logger
const debug = debug_("readium-desktop:main#utils/zip/create");

// strictly not necessary here,
// but see LCP no-compression-before-encryption for "codec" media resources
// which are then STORE'd in the ZIP
// (=> no unnecessary / costly DEFLATE in the ZIP directory, net benefit when "streaming" with HTTP byte-ranges):
// https://github.com/readium/readium-lcp-server/blob/e2c484f571a8013faf13a335c007890150751d79/pack/pack.go#L158-L170
// https://github.com/readium/readium-lcp-server/blob/e2c484f571a8013faf13a335c007890150751d79/pack/pack.go#L130-L132
// https://github.com/readium/readium-lcp-server/blob/e2c484f571a8013faf13a335c007890150751d79/pack/pack.go#L236-L239
// https://github.com/readium/readium-lcp-server/blob/e2c484f571a8013faf13a335c007890150751d79/pack/pack.go#L265-L267
// const doDeflate = (zipPath: string) => !/\.(PDF|PNG|JPE?G|MPE?G|HEIC|WEBP|MP3|MP4|WAV|OGG|AVI)$/i.test(zipPath);
const doDeflate = (_zipPath: string) => true;

export type TResourcesFSCreateZip = Array<[fsPath: string, zipPath: string]>;
export type TResourcesBUFFERCreateZip = Array<[chuncks: Buffer, zipPath: string]>;

export async function createZip(
    packagePath: string,
    resourcesMapFs: TResourcesFSCreateZip,
    resourcesMapBuffer?: TResourcesBUFFERCreateZip,
): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const zipfile = new ZipFile();

        // https://unpkg.com/browse/@types/yazl@2.4.5/index.d.ts
        // https://github.com/thejoshwolfe/yazl/blob/20584c378c654fc5b5ad141697ec539d7cb27c9e/index.js#L13
        if ((zipfile as unknown as EventEmitter).on)
        (zipfile as unknown as EventEmitter).on("error", (err) => {
            debug("createWebpubZip zipfile ERROR", packagePath, err);

            // reject(err);
        });

        const writeStream = createWriteStream(packagePath);
        writeStream.on("end", () => {
            debug("createWebpubZip writeStream END", packagePath);
        });
        writeStream.on("finish", () => {
            debug("createWebpubZip writeStream FINISH", packagePath);
        });
        writeStream.on("close", () => {
            debug("createWebpubZip writeStream CLOSE", packagePath);

            resolve();
        });
        writeStream.on("error", (err) => {
            debug("createWebpubZip writeStream ERROR", packagePath, err);

            reject(err);
        });

        zipfile.outputStream.on("end", () => {
            debug("createWebpubZip zipfile.outputStream END", packagePath);
        });
        zipfile.outputStream.on("finish", () => {
            debug("createWebpubZip zipfile.outputStream FINISH", packagePath);
        });
        zipfile.outputStream.on("close", () => {
            debug("createWebpubZip zipfile.outputStream CLOSE", packagePath);
        });
        zipfile.outputStream.on("error", (err) => {
            debug("createWebpubZip zipfile.outputStream ERROR", packagePath, err);
        });

        zipfile.outputStream.pipe(writeStream);

        resourcesMapFs.forEach(([fsPath, zipPath]) => {
            const compress = doDeflate(zipPath);
            debug("createWebpubZip addFile", zipPath, compress);
            zipfile.addFile(fsPath, zipPath, { compress });
        });

        resourcesMapBuffer?.forEach(([buffer, zipPath]) => {
            const compress = doDeflate(zipPath);
            debug("createWebpubZip addBuffer", zipPath, compress);
            zipfile.addBuffer(buffer, zipPath, { compress });
        });

        debug("createWebpubZip ENDING ...", packagePath);
        zipfile.end();
    });
}

export async function createWebpubZip(
    manifestBuffer: Buffer,
    resourcesMapFs: TResourcesFSCreateZip,
    resourcesMapBuffer?: TResourcesBUFFERCreateZip,
    name = "misc",
) {
    const pathFile = await createTempDir(nanoid(8), name);
    const packagePath = path.resolve(pathFile, "package.webpub");
    debug("createWebpubZip", packagePath);
    await createZip(packagePath, resourcesMapFs, [...(resourcesMapBuffer || []), [manifestBuffer, "manifest.json"]]);
    return packagePath;
}

const signManifest = (manifest: ICustomizationManifest) => {

    const manifestStringified = JSON.stringify(manifest);

    const sign = createSign("SHA256");
    sign.update(manifestStringified);
    sign.end();
    const signature = sign.sign(_CUSTOMIZATION_PROFILE_PRIVATE_KEY, "hex");

    return {
        key: _CUSTOMIZATION_PROFILE_PUB_KEY, // PUBLIC Not PRIVATE !?!
        value: signature,
        algorithm: "https://www.w3.org/2008/xmlsec/namespaces.html#ECKeyValue", // see scripts/profile-generate-key-pair.js
    };
};
const verifyManifest = (manifest: ICustomizationManifest) => {

    const signatureValue = manifest.signature.value;
    const signatureKey = manifest.signature.key;
    const stringifiedManifest = JSON.stringify({...manifest, signature: undefined});

    const verify = createVerify("SHA256");
    verify.write(stringifiedManifest);
    verify.end();
    const verified = verify.verify(signatureKey, signatureValue, "hex");
    return verified;
};
export async function createProfilePackageZip(
    manifest: ICustomizationManifest,
    resourcesMapFs: TResourcesFSCreateZip,
    outputProfilePath: string,
    signed = false,
    testSignature = false,
) {
    const packagePath = path.resolve(outputProfilePath,
        sanitizeForFilename((manifest.title["en"] || "") + "_" + (manifest.version || "") + EXT_THORIUM),
    );
    // const packagePathTMP = packagePath + ".tmp";

    debug("Ouput path =", packagePath);

    if (resourcesMapFs.length) {
        await createZip(packagePath, resourcesMapFs, []);
        const contentHash = await extractCrc32OnZip(packagePath, "profile");
        debug("ZIP CRC = ", contentHash);
        manifest.contentHash = contentHash;
        manifest.signature = undefined;

        if (signed) {
            const signature = signManifest(manifest);
            debug("Manifest signed", JSON.stringify(signature));
            manifest.signature = signature;
        }
        const manifestBuffer = Buffer.from(JSON.stringify(manifest, null, 4));
        const packagePathTMP = packagePath + ".tmpzip";
        await new Promise<void>((resolve, reject) => {
            injectBufferInZip(
                packagePath,
                packagePathTMP,
                manifestBuffer,
                "manifest.json",
                (e: any) => {
                    debug("injectManifestToZip - injectBufferInZip ERROR!");
                    debug(e);
                    reject(e);
                },
                () => {
                    resolve();
                });
        });

        unlinkSync(packagePath);
        await new Promise<void>((resolve, _reject) => {
            setTimeout(() => {
                resolve();
            }, 200); // to avoid issues with some filesystems (allow extra completion time)
        });
        renameSync(packagePathTMP, packagePath);
        await new Promise<void>((resolve, _reject) => {
            setTimeout(() => {
                resolve();
            }, 200); // to avoid issues with some filesystems (allow extra completion time)
        });
    } else {
        manifest.contentHash = "";
        manifest.signature = undefined;

        if (signed) {
            const signature = signManifest(manifest);
            debug("Manifest signed", JSON.stringify(signature));
            manifest.signature = signature;
        }
        const manifestBuffer = Buffer.from(JSON.stringify(manifest, null, 4));
        await createZip(packagePath, resourcesMapFs, [[manifestBuffer, "manifest.json"]]);
    }


    if (signed && testSignature) {
        if (verifyManifest(manifest)) {
            debug("PASS!: Manifest Signed And Verifed");
        } else {
            throw new Error("KO ERRRO!: Manifest not verified after signature");
        }
    }


    return packagePath;
}

if (__TH__IS_DEV__) {
    // console.log(require.main);
    // console.log(process.argv[1]);

    // npx webpack --config webpack.config.customization.js && DEBUG=r2:*,readium-desktop:* node ./dist/make-package.js --signed=true /tmp/test-profile /tmp
    if (process.argv[1] === path.resolve(process.cwd(), "./dist/make-package.js")) {


        if (process.argv.length !== 5) {
            console.error(`usage: ${process.argv[0]} ${process.argv[1]} --signed=[false|true] inputDirectory outputDirectory`);
            process.exit(1);
        }
        const signed = process.argv[2] === "--signed=true";
        const inputDir = path.resolve(process.cwd(), process.argv[3]);
        const outputDir = path.resolve(process.cwd(), process.argv[4]);

        const resourcesMap: Array<[string, string]> = [];

        const toBeVisit = ["./"];
        while (toBeVisit.length) {

            const dirPath = toBeVisit.shift();
            const dirAbsolutePath = path.join(inputDir, dirPath);
            const fileNameArray = readdirSync(dirAbsolutePath);
            for (const fileName of fileNameArray) {
                const filePath = path.join(dirPath, fileName);
                const fileAbsolutePath = path.join(inputDir, filePath);
                const stat = statSync(fileAbsolutePath);
                if (stat.isDirectory()) {
                    toBeVisit.push(filePath);
                } else {
                    if (filePath !== "manifest.json")
                        resourcesMap.push([fileAbsolutePath, filePath]);
                }
            }
        } // BFS


        let manifest: ICustomizationManifest;
        try {
            manifest = JSON.parse(readFileSync(path.join(inputDir, "manifest.json"), "utf-8"));
        } catch {
            console.error("manifest not found!!!");
            process.exit(1);
        }


        createProfilePackageZip(manifest, resourcesMap, outputDir, signed, true).then((outPath) => {
            console.log("OUTPUT=", outPath);
        }).catch((e) => console.error("ERROR!? ", e));

    }
}
