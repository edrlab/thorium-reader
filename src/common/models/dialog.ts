// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ImportOpdsPublication } from "readium-desktop/common/redux/states/import";
import { IOpdsPublicationView, IOpdsFeedView } from "readium-desktop/common/views/opds";
import { PublicationView } from "readium-desktop/common/views/publication";

interface IPubInfo {
    opdsPublication: IOpdsPublicationView | undefined;
    publicationIdentifier: string | undefined;
}

interface IFileImport {
    name: string;
    path: string;
}

export interface DialogType {
    "file-import": {
        files: IFileImport[];
    };
    "publication-info": IPubInfo;
    "publication-info-reader": IPubInfo;
    "opds-feed-add-form": {};
    "delete-publication-confirm": {
        publication: PublicationView;
    };
    "delete-opds-feed-confirm": {
        feed: IOpdsFeedView;
    };
    "lcp-authentication": {
        publication: PublicationView;
        hint: string;
    };
    "lsd-return-confirm": {
        publication: PublicationView;
    };
    "lsd-renew-confirm": {
        publication: PublicationView;
    };
    "same-file-import-confirm": {
        publication: ImportOpdsPublication;
        downloadSample: boolean;
    };
    "about-thorium": {};
}
