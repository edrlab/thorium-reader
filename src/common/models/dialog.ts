// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IOpdsFeedView } from "readium-desktop/common/views/opds";
import { PublicationView } from "readium-desktop/common/views/publication";
import { TPublication } from "readium-desktop/renderer/type/publication.type";

interface IPubInfoState {
    publication?: TPublication;
    coverZoom?: boolean;
}

export interface IFileImport {
    name: string;
    path: string;
}

export interface DialogType {
    "file-import": {
        files: IFileImport[];
    };
    "publication-info-opds": IPubInfoState;
    "publication-info-reader": IPubInfoState;
    "opds-feed-add-form": {};
    "delete-publication-confirm": {
        publicationView: PublicationView;
    };
    "delete-opds-feed-confirm": {
        feed: IOpdsFeedView;
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
