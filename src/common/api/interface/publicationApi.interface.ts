// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IOpdsLinkView, IOpdsPublicationView } from "readium-desktop/common/views/opds";
import { PublicationView } from "readium-desktop/common/views/publication";
import { SagaGenerator } from "typed-redux-saga";

export interface IRecoverablePublication {
    identifier: string;
    title: string;
    filePath: string;
}

export interface IPublicationApi {
    // get: (...a: [string]) => Promise<PublicationView> | void;
    get: (
        identifier: string,
        checkLcpLsd: boolean,
    ) => SagaGenerator<PublicationView>;
    delete: (
        identifier: string,
        preservePublicationOnFileSystem?: string,
        publicationFileLockAlreadyHeld?: boolean,
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
    importFromLink: (
        link: IOpdsLinkView,
        willBeImmediatelyFollowedByOpen: boolean,
        pub?: IOpdsPublicationView,
    ) => SagaGenerator<PublicationView>;
    importFromString: (
        manifest: string,
        willBeImmediatelyFollowedByOpen: boolean,
        baseFileUrl: string, // should starts with 'file://'
    ) => SagaGenerator<PublicationView>;
    importFromFs: (
        filePathArray: string | string[],
        willBeImmediatelyFollowedByOpen: boolean,
    ) => SagaGenerator<PublicationView[]>;
    selectFiles: (
    ) => SagaGenerator<string[]>;
    search: (
        title: string,
    ) => SagaGenerator<PublicationView[]>;
    searchEqTitle: (
        title: string,
    ) => SagaGenerator<PublicationView[]>;
    exportPublication: (
        publicationView: PublicationView,
    ) => SagaGenerator<void>;
    findAllRefresh: (
    ) => SagaGenerator<void>;
    findAllRecoverable: (
    ) => SagaGenerator<IRecoverablePublication[]>;
    recover: (
        identifiers?: string[],
    ) => SagaGenerator<PublicationView[]>;
}

export interface IPublicationModuleApi {
    "publication/get": IPublicationApi["get"];
    "publication/delete": IPublicationApi["delete"];
    "publication/findAll": IPublicationApi["findAll"];
    "publication/findByTag": IPublicationApi["findByTag"];
    "publication/updateTags": IPublicationApi["updateTags"];
    "publication/importFromLink": IPublicationApi["importFromLink"];
    "publication/importFromFs": IPublicationApi["importFromFs"];
    "publication/selectFiles": IPublicationApi["selectFiles"];
    "publication/importFromString": IPublicationApi["importFromString"];
    "publication/search": IPublicationApi["search"];
    "publication/searchEqTitle": IPublicationApi["searchEqTitle"];
    "publication/exportPublication": IPublicationApi["exportPublication"];
    "publication/findAllRefresh": IPublicationApi["findAllRefresh"];
    "publication/findAllRecoverable": IPublicationApi["findAllRecoverable"];
    "publication/recover": IPublicationApi["recover"];
}
