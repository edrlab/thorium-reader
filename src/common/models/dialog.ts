// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { OpdsFeedView, OpdsPublicationView } from "readium-desktop/common/views/opds";
import { PublicationView } from "readium-desktop/common/views/publication";

export interface IPubInfo {
    opdsPublicationView: OpdsPublicationView | undefined;
    publicationIdentifier: string | undefined;
}

export interface IFileImport {
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
        publicationView: PublicationView;
    };
    "delete-opds-feed-confirm": {
        feed: OpdsFeedView;
    };
    "lcp-authentication": {
        publicationView: PublicationView;
        hint: string;
        message: string | undefined;
    };
    "lsd-return-confirm": {
        publicationView: PublicationView;
    };
    "lsd-renew-confirm": {
        publicationView: PublicationView;
    };
    "about-thorium": {};
}
