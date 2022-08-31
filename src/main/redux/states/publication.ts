// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// import { File } from "readium-desktop/common/models/file";
// import { CustomCover } from "readium-desktop/common/models/custom-cover";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";

// export interface IPublicationState {
//     publicationIdentifier: string;
//     title: string;
//     authors: string[];
//     description: string;
//     tags: string[];
//     files: File[];
//     coverFile?: File;
//     customCover?: CustomCover;

//     lcpRightsCopies?: number;

//     hash: string;
// }

export interface IDictPublicationState {
    [publicationIdentifier: string]: PublicationDocument;
}
