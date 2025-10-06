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
import { customizationManifestJsonSchema, ICustomizationManifest } from "readium-desktop/common/readium/customization/manifest";
import { tryCatch } from "readium-desktop/utils/tryCatch";
import { extractCrc32OnZip } from "../tools/crc";
import * as path from "path";
import * as semver from "semver";
import { readdirSync, existsSync, mkdirSync } from "fs";
import { ICustomizationProfileProvisioned, ICustomizationProfileError, ICustomizationProfileProvisionedWithError } from "readium-desktop/common/redux/states/customization";
import { app } from "electron";
import { _CUSTOMIZATION_PROFILE_PUB_KEY } from "readium-desktop/preprocessor-directives";
import { THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL, THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL__IP_ORIGIN_STREAMER } from "readium-desktop/common/streamerProtocol";
import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { diMainGet } from "../di";
import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import { OPDSPublication } from "@r2-opds-js/opds/opds2/opds2-publication";

// Logger
const debug = debug_("readium-desktop:main#utils/customization/provisioning");

export const customizationWellKnownFolder = path.join(app.getPath("userData"), "custom-profiles");

try {
    if (!existsSync(customizationWellKnownFolder)) {
        mkdirSync(customizationWellKnownFolder);
        debug(`Customization well-known folder created \"${customizationWellKnownFolder}\"`);
    }
} catch (e) {
    debug("ERROR!!: Customization well-known folder not created", e);
}

export let __CUSTOMIZATION_PROFILE_MANIFEST_AJV_ERRORS = "";
export function isCustomizationProfileManifest(data: any): data is ICustomizationManifest {

    const ajv = new Ajv();
    addFormats(ajv);

    const valid = ajv.validate(customizationManifestJsonSchema, data);

    __CUSTOMIZATION_PROFILE_MANIFEST_AJV_ERRORS = ajv.errors?.length ? JSON.stringify(ajv.errors, null, 2) : "";

    return valid;
}


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

    if (manifest.manifestVersion !== 1) {
        return Promise.reject("Not a valid manifestVersion");
    }

    if (!isCustomizationProfileManifest(manifest)) { // version 1

        debug("Error: ", __CUSTOMIZATION_PROFILE_MANIFEST_AJV_ERRORS);
        return Promise.reject("Manifest parsing error: " + __CUSTOMIZATION_PROFILE_MANIFEST_AJV_ERRORS);
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

    if (manifest.signature.key !== _CUSTOMIZATION_PROFILE_PUB_KEY) {
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
    const contentHash = await extractCrc32OnZip(packageAbsolutePath, "profile");
    if (manifest.contentHash !== contentHash) {
        return Promise.reject("manifest contentHash missmatch");
    }

    return true;
}

export async function customizationPackageProvisionningFromFolder(wellKnownFolder: string): Promise<[ICustomizationProfileProvisioned[], ICustomizationProfileError[]]>{

    let packagesArray: ICustomizationProfileProvisioned[] = [];
    const packagesErrorArray: ICustomizationProfileError[] = [];
    const results = readdirSync(wellKnownFolder, {withFileTypes: true});

    for (const dirent of results) {
        if (dirent.isFile() && path.extname(dirent.name) === ".thorium") { 
            const packageFileName = dirent.name;
            debug("Found => ", packageFileName);
            const profileProvisioned = await customizationPackageProvisioningAccumulator(packagesArray, packageFileName);
            if ((profileProvisioned as ICustomizationProfileError).error) {
                debug("ERROR: Profile not provisioned, due to error :", (profileProvisioned as ICustomizationProfileError).message);
                packagesErrorArray.push((profileProvisioned as ICustomizationProfileError));
            } else {
                packagesArray = [
                    ...packagesArray.filter(({id}) => (profileProvisioned as ICustomizationProfileProvisioned).id !== id),
                    profileProvisioned as ICustomizationProfileProvisioned,
                ];
            }
        }
    }

    return [packagesArray, packagesErrorArray];
}

export async function customizationPackageProvisioningAccumulator(packagesArray: ICustomizationProfileProvisioned[], packageFileName: string): Promise<ICustomizationProfileProvisionedWithError> {

    const packageFileNameFound = packagesArray.find(({ fileName }) => fileName === packageFileName);
    if (packageFileNameFound) {
        packagesArray = packagesArray.filter(({ fileName }) => fileName !== packageFileName);
    }
    let manifest: ICustomizationManifest;
    let error = "";
    try {
        manifest = await customizationPackageProvisioning(packageFileName);
    } catch (e) {
        debug("Error when provisioning this profile =>", packageFileName);
        error = `${e}`;
    }

    if (!manifest) {
        return { id: undefined, fileName: packageFileName, version: undefined, error: true, message: error };
    }

    const packageProvisionedWithTheSameIdentifier = packagesArray.find(({ id }) => id === manifest.identifier);
    if (!packageProvisionedWithTheSameIdentifier || semver.gt(manifest.version, packageProvisionedWithTheSameIdentifier.version)) {

        const logoObj = manifest.images?.find((ln) => ln?.rel === "logo");
        debug("find manifest for this profile", manifest.identifier, " LOGO Obj:", logoObj);
        const baseUrl = `${THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL}://${THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL__IP_ORIGIN_STREAMER}/custom-profile-zip/${encodeURIComponent_RFC3986(Buffer.from(manifest.identifier).toString("base64"))}/`;
        const logoUrl = baseUrl + encodeURIComponent_RFC3986(Buffer.from(logoObj.href).toString("base64"));

        const publicationsView = [];
        const publications = manifest.publications;
        if (publications?.length) {
            const opdsFeedViewConverter = diMainGet("opds-feed-view-converter");

            for (const opdsPubJson of publications) {

                const opdsPublication = TaJsonDeserialize(
                    opdsPubJson,
                    OPDSPublication,
                );
                const opdsPubView = opdsFeedViewConverter.convertOpdsPublicationToView(opdsPublication, "/");
                if (opdsPubView) {
                    publicationsView.push(opdsPubView);
                }
            }    

        }

        return { id: manifest.identifier, fileName: packageFileName, version: manifest.version, logoUrl, title: manifest.title, description: manifest.description, opdsPublicationView: publicationsView };
    }

    return { id: manifest.identifier, fileName: packageFileName, version: manifest.version, error: true, message: "profile version is under or equal to the currrent provisioned profile version" };
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
