// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import { createVerify } from "crypto";
import * as debug_ from "debug";
import { streamToBufferPromise } from "@r2-utils-js/_utils/stream/BufferUtils";
import { zipLoadPromise } from "@r2-utils-js/_utils/zip/zipFactory";
import { ICustomizationManifest } from "readium-desktop/common/readium/customization/manifest";
import { tryCatch } from "readium-desktop/utils/tryCatch";
import { extractCrc32OnZip } from "../tools/crc";
import * as path from "path";
import * as semver from "semver";
import { readdirSync, existsSync, mkdirSync } from "fs";
import { ICustomizationProfileProvisioned } from "readium-desktop/common/redux/states/customization";
import { app } from "electron";


// Logger
const debug = debug_("readium-desktop:main#utils/customization/provisioning");

const pubkey = `-----BEGIN PUBLIC KEY-----
MFIwEAYHKoZIzj0CAQYFK4EEAAMDPgAEHSejvBFWB/vIgEJfDwz0HNO6MIsWjsf2
5JKKOC4tQPIaFq8v+CSonSJUC0bZS1obT3GSSFjDE3Ya/pEV
-----END PUBLIC KEY-----`;

export const customizationWellKnownFolder = path.join(app.getPath("userData"), ".well-known");

try {
    if (!existsSync(customizationWellKnownFolder)) {
        mkdirSync(customizationWellKnownFolder);
        debug(`Customization well-known folder created \"${customizationWellKnownFolder}\"`);
    }
} catch {}

async function getManifestFromZipPath(zipPath: string): Promise<ICustomizationManifest> {
    const zip = await tryCatch(() => zipLoadPromise(zipPath), "");
    if (!zip) {
        return Promise.reject("Not a ZIP package");
    }

    if (!zip.hasEntries()) {
        // return Promise.reject("LPF zip empty");
        return Promise.reject("Zip has no entries");
    }

    if (!zip.hasEntry("manifest.json")) {
        return Promise.reject("manifest not found");
    }

    const manifestStream = await zip.entryStreamPromise("manifest.json");
    const manifestBuffer = await streamToBufferPromise(manifestStream.stream);
    const manifest: ICustomizationManifest = JSON.parse(manifestBuffer.toString());

    if (manifest.manifest_version !== 1) {
        return Promise.reject("Not a valid manifest_version");
    }

    return manifest;
}

async function checkIfProfilePackageSigned(manifest: ICustomizationManifest, zipPath: string) {

    if (__TH__IS_DEV__ && manifest.signature === undefined) {
        return true;
    }

    if (!manifest.signature) {
        return Promise.reject("no signature found");
    }

    if (manifest.signature.key !== pubkey) {
        return Promise.reject("manifest public key different from shipped public key");

    }

    const signature = JSON.parse(JSON.stringify(manifest.signature));
    manifest.signature = undefined;

    const verify = createVerify("SHA256");
    verify.write(JSON.stringify(manifest));;
    verify.end();

    if (!verify.verify(pubkey, signature.value, "hex")) {
        return Promise.reject("manifest not verified from signature");
    }

    const content_hash = await extractCrc32OnZip(zipPath, "profile");
    if (manifest.content_hash !== content_hash) {
        return Promise.reject("manifest content_hash missmatch");
    }

    return true;
}

export async function customizationPackageProvisionningFromFolder(wellKnownFolder: string): Promise<ICustomizationProfileProvisioned[]>{

    let packagesArray: ICustomizationProfileProvisioned[] = [];
    const results = readdirSync(wellKnownFolder, {withFileTypes: true});

    for (const dirent of results) {
        if (dirent.isFile() && path.extname(dirent.name) === ".thor") { 
            packagesArray = await customizationPackageProvisioningAccumulator(packagesArray, dirent.name);
        }
    }

    return packagesArray;
}

export async function customizationPackageProvisioningAccumulator(packagesArray: ICustomizationProfileProvisioned[], zipPath: string): Promise<ICustomizationProfileProvisioned[]> {
    try {
        const manifest = await customizationPackageProvisioning(zipPath);
        const packageProvisionedWithTheSameIdentifier = packagesArray.find(({identifier}) => identifier === manifest.identifier);
        const { version: provisionedVersion } = packageProvisionedWithTheSameIdentifier;
        if (
            !packageProvisionedWithTheSameIdentifier || semver.gt(manifest.version, provisionedVersion)
        ) {
            return [
                ...packagesArray.filter(({ identifier }) => identifier !== manifest.identifier),
                { identifier: manifest.identifier, fileName: path.basename(zipPath), version: manifest.version },
            ];
        }
    } catch (e) {
        debug("Error when provisioning this profile=", zipPath);
        debug(e);
    }

    return packagesArray;
}

export async function customizationPackageProvisioning(zipPath: string): Promise<ICustomizationManifest> {

    debug("start provisioning => ", zipPath);

    const manifest = await getManifestFromZipPath(zipPath);
    await checkIfProfilePackageSigned(manifest, zipPath);

    // TODO check ressources !?


    debug("Read manifest.json from ", zipPath);
    debug(JSON.stringify(manifest, null, 4));
    return manifest;
}
