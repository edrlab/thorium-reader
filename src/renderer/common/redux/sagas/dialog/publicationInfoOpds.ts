// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import { apiActions, dialogActions } from "readium-desktop/common/redux/actions";
import { takeTyped } from "readium-desktop/common/redux/typed-saga";
import { IOpdsLinkView } from "readium-desktop/common/views/opds";
import { TApiMethod } from "readium-desktop/main/api/api.type";
import { ReturnPromiseType } from "readium-desktop/typings/promise";
import { all, call, put } from "redux-saga/effects";

import { apiSaga } from "../api";

const REQUEST_ID = "PUBINFO_OPDS_REQUEST_ID";

// Logger
const debug = debug_("readium-desktop:renderer:redux:saga:publication-info-opds");

// global access to opdsLInksView in iterator
let linksIterator: IterableIterator<IOpdsLinkView>;

// While a link is available dispatch API Redux
function* browsePublication() {
    const linkIterator = linksIterator.next();

    // https://github.com/microsoft/TypeScript/issues/33353
    if (!linkIterator.done) {
        const link = linkIterator.value as IOpdsLinkView;
        if (link) {
            yield* apiSaga("opds/browse", REQUEST_ID, link.url);
        }
    }
}

// Triggered when a publication-info-opds is asked
function* checkOpdsPublicationWatcher() {
    while (true) {
        const action = yield* takeTyped(dialogActions.openRequest.build);

        if (action.payload?.type === DialogTypeName.PublicationInfoOpds) {

            debug("Triggered publication-info-opds");

            const dataPayload = (action.payload as
                dialogActions.openRequest.Payload<DialogTypeName.PublicationInfoOpds>).data;
            const publication = dataPayload?.publication;

            debug("publication entryLinksArray", publication.entryLinks);

            // dispatch the publication to publication-info even not complete
            yield put(dialogActions.updateRequest.build<DialogTypeName.PublicationInfoOpds>({
                publication,
                coverZoom: false,
            }));

            // find the entry url even if all data is already load in publication
            if (publication && Array.isArray(publication.entryLinks) && publication.entryLinks[0]) {
                linksIterator = publication.entryLinks.values();

                yield* browsePublication();
            }
        }
    }
}

// Triggered when the publication data are available from the API
function* updateOpdsPublicationWatcher() {
    while (true) {
        const action = yield* takeTyped(apiActions.result.build);
        const { requestId } = action.meta.api;

        if (requestId === REQUEST_ID) {
            debug("opds publication from publicationInfo received");

            const actionError = action.error;

            const httpRes = action.payload as
                ReturnPromiseType<TApiMethod["opds/browse"]>;

            const opdsResultView = httpRes?.data;
            debug("Payload: ", opdsResultView);

            const publication = opdsResultView.publications ? opdsResultView.publications[0] : undefined;

            if (!actionError
                && httpRes.isSuccess
                && publication && publication?.title
                && Array.isArray(publication.authors)
            ) {
                yield put(
                    dialogActions.updateRequest.build<DialogTypeName.PublicationInfoOpds>(
                        {
                            publication,
                        },
                    ),
                );

            // could be 401 OPDS Authentication document,
            // which we ignore in this case because should not occur with "entry" URLs (unlike "borrow", for example)
            } else {

                if (actionError) {
                    debug(httpRes);
                }

                yield* browsePublication();
            }
        }
    }
}

export function* watchers() {
    yield all([
        call(checkOpdsPublicationWatcher),
        call(updateOpdsPublicationWatcher),
    ]);
}
