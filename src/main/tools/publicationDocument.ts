// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { CustomCover, RandomCustomCovers } from "readium-desktop/common/models/custom-cover";
import { File } from "readium-desktop/common/models/file";

export interface IPublicationFilesDocumentPatch {
    coverFile?: File;
    customCover?: CustomCover;
    files: File[];
}

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
