// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IOpdsLinkView } from "readium-desktop/common/views/opds";
import { PublicationView } from "readium-desktop/common/views/publication";
import { SagaGenerator } from "typed-redux-saga";

export interface IPublicationApi {
    // get: (...a: [string]) => Promise<PublicationView> | void;
    get: (
        identifier: string,
        checkLcpLsd: boolean,
    ) => SagaGenerator<PublicationView>;
    delete: (
        identifier: string,
    ) => SagaGenerator<void>;
    findAll: (
    ) => SagaGenerator<PublicationView[]>;
    findByTag: (
        tag: string,
    ) => SagaGenerator<PublicationView[]>;
    updateTags: (
        identifier: string,
        tags: string[],
    ) => SagaGenerator<PublicationView>;
    getAllTags: (
    ) => SagaGenerator<string[]>;
    importFromLink: (
        link: IOpdsLinkView,
        r2OpdsPublicationBase64: string,
    ) => SagaGenerator<PublicationView>;
    importFromFs: (
        filePathArray: string | string[],
    ) => SagaGenerator<PublicationView[]>;
    search: (
        title: string,
    ) => SagaGenerator<PublicationView[]>;
    exportPublication: (
        publicationView: PublicationView,
    ) => SagaGenerator<void>;
}

export interface IPublicationModuleApi {
    "publication/get": IPublicationApi["get"];
    "publication/delete": IPublicationApi["delete"];
    "publication/findAll": IPublicationApi["findAll"];
    "publication/findByTag": IPublicationApi["findByTag"];
    "publication/updateTags": IPublicationApi["updateTags"];
    "publication/getAllTags": IPublicationApi["getAllTags"];
    "publication/importFromLink": IPublicationApi["importFromLink"];
    "publication/importFromFs": IPublicationApi["importFromFs"];
    "publication/search": IPublicationApi["search"];
    "publication/exportPublication": IPublicationApi["exportPublication"];
}
