// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { CustomCover, RandomCustomCovers } from "readium-desktop/common/models/custom-cover";
import { File } from "readium-desktop/common/models/file";
import type { IOpdsLinkView, IOpdsPublicationView } from "readium-desktop/common/views/opds";
import type { PublicationDocument } from "readium-desktop/main/db/document/publication";

export interface IPublicationFilesDocumentPatch {
    coverFile?: File;
    customCover?: CustomCover;
    files: File[];
}

export type TOpdsPublicationDocumentPatch = Pick<
    PublicationDocument,
    "opdsPublication" | "opdsPublicationStringified" | "opdsPublicationView"
>;

export const pickRandomCustomCover = (): CustomCover =>
    RandomCustomCovers[Math.floor(Math.random() * RandomCustomCovers.length)];

export const buildPublicationFilesDocumentPatch = (
    publicationFiles: File[],
    existingCustomCover?: CustomCover,
): IPublicationFilesDocumentPatch => {

    const files: File[] = [];
    let coverFile: File | undefined;

    for (const file of publicationFiles) {
        if (file.contentType.startsWith("image")) {
            coverFile = file;
        } else {
            files.push(file);
        }
    }

    return {
        coverFile,
        customCover: coverFile ? undefined : existingCustomCover ?? pickRandomCustomCover(),
        files,
    };
};

export const buildOpdsPublicationDocumentPatch = (
    link: IOpdsLinkView,
    publication?: IOpdsPublicationView,
): TOpdsPublicationDocumentPatch => ({
    opdsPublicationStringified: publication?.opdsPublicationStringified,
    opdsPublicationView: publication,
    opdsPublication: {
        url: link.url,
        type: link.type,
        selfLinkUrl: publication?.selfLink?.url,
        identifier: publication?.workIdentifier,
    },
});
