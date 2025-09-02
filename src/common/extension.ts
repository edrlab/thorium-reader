// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import { ObjectKeys, ObjectValues } from "readium-desktop/utils/object-keys-values";

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
    // customizationProfilePackage: ".thor",

    // cbz: ".cbz",
};

export const acceptedExtensionArray = ObjectValues(acceptedExtensionObject);

export const acceptedExtension = (ext: string) =>
    ObjectKeys(acceptedExtensionObject).reduce(
        (pv, cv) =>
            pv || isAcceptedExtension(cv, ext),
            false,
    );

export const isAcceptedExtension = (key: keyof typeof acceptedExtensionObject, ext: string) =>
    (new RegExp(`${acceptedExtensionObject[key]
        ? acceptedExtensionObject[key].replace(/\./g, "\\.")
        : acceptedExtensionObject[key]}$`, "i")).test(ext);
