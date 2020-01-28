// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IOpdsLinkView } from "readium-desktop/common/views/opds";
import { PublicationView } from "readium-desktop/common/views/publication";

export interface IPublicationApi {
    // get: (...a: [string]) => Promise<PublicationView> | void;
    get: (
        identifier: string,
        checkLcpLsd: boolean,
    ) => Promise<PublicationView>;
    delete: (
        identifier: string,
    ) => Promise<void>;
    findAll: (
    ) => Promise<PublicationView[]>;
    findByTag: (
        tag: string,
    ) => Promise<PublicationView[]>;
    updateTags: (
        identifier: string,
        tags: string[],
    ) => Promise<PublicationView>;
    getAllTags: (
    ) => Promise<string[]>;
    importOpdsPublicationLink: (
        link: IOpdsLinkView,
        r2OpdsPublicationBase64: string,
    ) => Promise<PublicationView>;
    import: (
        filePathArray: string | string[],
    ) => Promise<PublicationView[]>;
    search: (
        title: string,
    ) => Promise<PublicationView[]>;
    exportPublication: (
        publicationView: PublicationView,
    ) => Promise<void>;
}

export interface IPublicationModuleApi {
    "publication/get": IPublicationApi["get"];
    "publication/delete": IPublicationApi["delete"];
    "publication/findAll": IPublicationApi["findAll"];
    "publication/findByTag": IPublicationApi["findByTag"];
    "publication/updateTags": IPublicationApi["updateTags"];
    "publication/getAllTags": IPublicationApi["getAllTags"];
    "publication/importOpdsPublicationLink": IPublicationApi["importOpdsPublicationLink"];
    "publication/import": IPublicationApi["import"];
    "publication/search": IPublicationApi["search"];
    "publication/exportPublication": IPublicationApi["exportPublication"];
}
