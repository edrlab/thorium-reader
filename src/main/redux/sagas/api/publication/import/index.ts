// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { ToastType } from "readium-desktop/common/models/toast";
import { toastActions } from "readium-desktop/common/redux/actions";
import { IOpdsLinkView, IOpdsPublicationView } from "readium-desktop/common/views/opds";
import { PublicationView } from "readium-desktop/common/views/publication";
import { diMainGet } from "readium-desktop/main/di";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { put } from "redux-saga/effects";
import { SagaGenerator } from "typed-redux-saga";
import { all as allTyped, call as callTyped } from "typed-redux-saga/macro";

import { importFromFsService } from "./importFromFs";
import { importFromLinkService } from "./importFromLink";
import { importFromStringService } from "./importFromString";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { PublicationViewConverter } from "readium-desktop/main/converter/publication";

// Logger
const debug = debug_("readium-desktop:main#saga/api/publication/import");

const convertDoc = async (doc: PublicationDocument, publicationViewConverter: PublicationViewConverter) => {
    return await publicationViewConverter.convertDocumentToView(doc);
};

export function* importFromLink(
    link: IOpdsLinkView,
    pub?: IOpdsPublicationView,
): SagaGenerator<PublicationView | undefined> {

    const translate = diMainGet("translator").translate;

    try {

        const [publicationDocument, alreadyImported] = yield* callTyped(importFromLinkService, link, pub);

        if (!publicationDocument) {
            throw new Error("publicationDocument not imported on db");
        }

        const publicationViewConverter = diMainGet("publication-view-converter");
        const publicationView = yield* callTyped(() => convertDoc(publicationDocument, publicationViewConverter));

        if (alreadyImported) {
            yield put(
                toastActions.openRequest.build(
                    ToastType.Success,
                    translate("message.import.alreadyImport",
                        { title: publicationView.title }),
                ),
            );

        } else {
            yield put(
                toastActions.openRequest.build(
                    ToastType.Success,
                    translate("message.import.success",
                        { title: publicationView.title }),
                ),
            );

        }

        return publicationView;

    } catch (e) {

        debug("importFromLink failed", e.toString(), e.trace);
        yield put(
            toastActions.openRequest.build(
                ToastType.Error,
                translate("message.import.fail",
                    { path: link.url, err: e?.toString() }),
            ),
        );
    }

    return undefined;
}

export function* importFromString(
    manifest: string,
    baseFileUrl: string, // should starts with 'file://'
): SagaGenerator<PublicationView | undefined> {

    if (manifest) {

        try {
            const [publicationDocument]  = yield* callTyped(importFromStringService, manifest, baseFileUrl);

            if (!publicationDocument) {
                throw new Error("publicationDocument not imported on db");
            }

            const publicationViewConverter = diMainGet("publication-view-converter");

            return yield* callTyped(() => convertDoc(publicationDocument, publicationViewConverter));

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
            callTyped(function*(): SagaGenerator<PublicationView> {

                const translate = diMainGet("translator").translate;

                try {

                    // const { b: [publicationDocument, alreadyImported] } = yield* raceTyped({
                    //     a: delay(30000),
                    //     b: callTyped(importFromFsService, fpath),
                    // });
                    const data = yield* callTyped(importFromFsService, fpath);
                    if (!data) {
                        throw new Error("importFromFsService undefined");
                    }
                    const [publicationDocument, alreadyImported] = data;

                    if (!publicationDocument) {
                        throw new Error("publicationDocument not imported on db");
                    }

                    const publicationView = yield* callTyped(() => convertDoc(publicationDocument, publicationViewConverter));

                    if (alreadyImported) {
                        yield put(
                            toastActions.openRequest.build(
                                ToastType.Success,
                                translate("message.import.alreadyImport",
                                    { title: publicationView.title }),
                            ),
                        );

                    } else {
                        yield put(
                            toastActions.openRequest.build(
                                ToastType.Success,
                                translate("message.import.success",
                                    { title: publicationView.title }),
                            ),
                        );

                    }

                    return publicationView;

                } catch (error) {

                    debug("importFromFs (hash + import) fail with :" + filePath, error);
                    yield put(
                        toastActions.openRequest.build(
                            ToastType.Error,
                            translate("message.import.fail",
                                { path: filePath, err: error?.toString() }),
                        ),
                    );
                }

                return undefined;
            }),
    );

    const pubView = yield* allTyped(effects);
    const ret = pubView.filter((v) => v);

    return ret;
}
