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
MIGbMBAGByqGSM49AgEGBSuBBAAjA4GGAAQBfuZMzJiHFuYrPHXkrzFvE4TLJCtt
KH2trb1daSymrTwrULHNVa68ci1du2qO1QCJfRyzXhM3Xb1EClcjLc7wQFgAaw+2
y9rrRYgNAPwvst6FjzS6ZSxNLmc+iubRYSpZaW4OOXk65cbwY1tcws2o+RtCoKlK
z/sqIdxiPLBfKh+CGU4=
-----END PUBLIC KEY-----
`;

export const customizationWellKnownFolder = path.join(app.getPath("userData"), ".well-known");

try {
    if (!existsSync(customizationWellKnownFolder)) {
        mkdirSync(customizationWellKnownFolder);
        debug(`Customization well-known folder created \"${customizationWellKnownFolder}\"`);
    }
} catch {}

async function getManifestFromPackageFileName(packageFileName: string): Promise<ICustomizationManifest> {
    const packageAbsolutePath = path.join(customizationWellKnownFolder, packageFileName);
    const zip = await tryCatch(() => zipLoadPromise(packageAbsolutePath), "");
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

async function checkIfProfilePackageSigned(manifest: ICustomizationManifest, packageFileName: string) {

    if (__TH__IS_DEV__ && manifest.signature === undefined) {
        return true;
    }

    if (!manifest.signature || !manifest.signature.value) {
        return Promise.reject("no signature found");
    }

    if (manifest.signature.key !== pubkey) {
        return Promise.reject("manifest public key different from shipped public key");

    }

    const signatureValue = manifest.signature.value;
    const signatureKey = manifest.signature.key;
    const stringifiedManifest = JSON.stringify({...manifest, signature: undefined});

    const verify = createVerify("SHA256");
    verify.write(stringifiedManifest);
    verify.end();

    const verified = verify.verify(signatureKey, signatureValue, "hex");
    if (!verified) {
        return Promise.reject("manifest not verified from signature");
    }

    const packageAbsolutePath = path.join(customizationWellKnownFolder, packageFileName);
    const content_hash = await extractCrc32OnZip(packageAbsolutePath, "profile");
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
            const packageFileName = dirent.name;
            debug("Found => ", packageFileName);
            packagesArray = await customizationPackageProvisioningAccumulator(packagesArray, packageFileName);
        }
    }

    return packagesArray;
}

export async function customizationPackageProvisioningAccumulator(packagesArray: ICustomizationProfileProvisioned[], packageFileName: string): Promise<ICustomizationProfileProvisioned[]> {
    try {
        const manifest = await customizationPackageProvisioning(packageFileName);
        const packageProvisionedWithTheSameIdentifier = packagesArray.find(({identifier}) => identifier === manifest.identifier);
        if (
            !packageProvisionedWithTheSameIdentifier || semver.gt(manifest.version, packageProvisionedWithTheSameIdentifier.version)
        ) {

            const packageProvisionedObj = { identifier: manifest.identifier, fileName: path.basename(packageFileName), version: manifest.version };
            debug(`package "${packageFileName}" provisonned :=>`, packageProvisionedObj);
            return [
                ...packagesArray.filter(({ identifier }) => identifier !== manifest.identifier),
                packageProvisionedObj,
            ];
        }
    } catch (e) {
        debug("Error when provisioning this profile =>", packageFileName);
        debug(e);
    }

    debug("Something went wrong", packageFileName, "not provisioned, return : ", JSON.stringify(packagesArray, null, 4));
    return packagesArray;
}

export async function customizationPackageProvisioning(packageFileName: string): Promise<ICustomizationManifest> {

    debug("start provisioning => ", packageFileName);

    const manifest = await getManifestFromPackageFileName(packageFileName);
    await checkIfProfilePackageSigned(manifest, packageFileName);

    // TODO check ressources !?


    debug("Read manifest.json from ", packageFileName);
    debug(JSON.stringify(manifest, null, 4));
    return manifest;
}
