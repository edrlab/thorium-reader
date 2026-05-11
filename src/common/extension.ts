// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import { ObjectValues } from "readium-desktop/utils/object-keys-values";

export const EXT_THORIUM = ".thorium";
export const EXT_ANNOTATIONS = ".annotation";

// cf src/utils/mimeTypes.ts
export const acceptedExtensionObject = {
    lcpLicence: ".lcpl",
    epub: ".epub",
    epub3: ".epub3",
    pnld: ".pnld",
    audiobook: ".audiobook",
    webpub: ".webpub",
    audiobookLcp: ".lcpa",
    audiobookLcpAlt: ".lcpaudiobook",
    pdfLcp: ".lcpdf",
    pdf: ".pdf",
    w3cAudiobook: ".lpf",
    divina: ".divina",
    daisy: ".daisy",
    zip: ".zip",
    opf: ".opf",
    nccHtml: "ncc.html",
    // customizationProfilePackage: EXT_THORIUM,
    // annotations: EXT_ANNOTATIONS,

    // cbz: ".cbz",
};

export const acceptedExtensionArray = ObjectValues(acceptedExtensionObject);

export const normalizeExtension = (ext: string) =>
    (ext.startsWith(".") ? ext : `.${ext}`).toLowerCase();

export const getExtensionWithoutDot = (ext: string) =>
    normalizeExtension(ext).slice(1);

const extensionMatches = (acceptedExt: string, ext: string) => {
    if (!acceptedExt.startsWith(".")) {
        return ext.toLowerCase().endsWith(acceptedExt.toLowerCase());
    }
    return normalizeExtension(ext).endsWith(normalizeExtension(acceptedExt));
};

export const acceptedExtension = (ext: string) =>
    acceptedExtensionArray.some((acceptedExt) => extensionMatches(acceptedExt, ext));

export const isAcceptedExtension = (key: keyof typeof acceptedExtensionObject, ext: string) =>
    extensionMatches(acceptedExtensionObject[key], ext);

export const publicationFileExtensionsForDialog = acceptedExtensionArray.map((extension) =>
    extension === acceptedExtensionObject.nccHtml ?
        "html" :
        extension.replace(/^\./, ""),
);
