// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { allTyped, callTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { IOpdsLinkView, IOpdsPublicationView } from "readium-desktop/common/views/opds";
import { PublicationView } from "readium-desktop/common/views/publication";
import { diMainGet } from "readium-desktop/main/di";
import { call } from "redux-saga/effects";
import { SagaGenerator } from "typed-redux-saga";
import { importFromStringService } from "./importFromString";

import { importFromFsService } from "./importFromFs";
import { importFromLinkService } from "./importFromLink";

export function* importFromLink(
    link: IOpdsLinkView,
    pub?: IOpdsPublicationView,
): SagaGenerator<PublicationView | undefined> {

    if (link?.url) {

        try {
            const publicationDocument = yield* callTyped(importFromLinkService, link, pub);

            if (!publicationDocument) {
                throw new Error("publicationDocument not imported on db");
            }

            const publicationViewConverter = diMainGet("publication-view-converter");
            return publicationViewConverter.convertDocumentToView(publicationDocument);

        } catch (error) {
            throw new Error(`importFromLink error ${error}`);
        }
    }

    return undefined;
}

export function* importFromString(
    manifest: string,
): SagaGenerator<PublicationView | undefined> {

    if (manifest) {

        try {
            const publicationDocument = yield* callTyped(importFromStringService, manifest);

            if (!publicationDocument) {
                throw new Error("publicationDocument not imported on db");
            }

            const publicationViewConverter = diMainGet("publication-view-converter");
            return publicationViewConverter.convertDocumentToView(publicationDocument);

        } catch (error) {
            throw new Error(`importFromLink error ${error}`);
        }
    }

    return undefined;
}

export function* importFromFs(
    filePath: string | string[],
): SagaGenerator<PublicationView[] | undefined> {

    const filePathArray = Array.isArray(filePath) ? filePath : [filePath];

    const publicationViewConverter = diMainGet("publication-view-converter");

    const effects = filePathArray.map(
        (fpath: string) =>
            call(function*() {

                try {

                    if (fpath) {
                        const pub = yield* callTyped(importFromFsService, fpath);

                        return publicationViewConverter.convertDocumentToView(pub);
                    }
                } catch {
                    // ignore
                }

                return undefined;
            }));

    const pubView = yield* allTyped(effects);

    const ret = pubView.filter((v) => v);

    return ret;
}
