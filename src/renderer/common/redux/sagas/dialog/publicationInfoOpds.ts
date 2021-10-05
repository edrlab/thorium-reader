// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import { dialogActions } from "readium-desktop/common/redux/actions";
import { takeSpawnLatest } from "readium-desktop/common/redux/sagas/takeSpawnLatest";
import { IOpdsLinkView } from "readium-desktop/common/views/opds";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { call, delay, put, race, take } from "redux-saga/effects";
import { race as raceTyped } from "typed-redux-saga/macro";

import { opdsBrowse } from "../httpBrowser";

// Test URL : http://readium2.herokuapp.com/opds-v1-v2-convert/http%3A%2F%2Fmanybooks.net%2Fopds%2Fnew_titles.php

const REQUEST_ID = "PUBINFO_OPDS_REQUEST_ID";

// Logger
const filename_ = "readium-desktop:renderer:redux:saga:publication-info-opds";
const debug = debug_(filename_);

// Triggered when the publication data are available from the API
function* updateOpdsInfoWithEntryLink(links: IOpdsLinkView[]) {

    if (!Array.isArray(links)) return;
    debug("updateOpdsInfoWithEntryLink", links);

    for (const link of links) {

        if (typeof link?.url !== "string") continue;
        const { b: action } = yield* raceTyped({
            a: delay(20000),
            b: call(opdsBrowse, link.url, REQUEST_ID),
        });

        if (!action) {
            debug("updateOpdsInfoWithEntryLink timeout?", link.url);
            continue;
        }
        if (action.error) {
            debug("action error", action.payload);
            continue;
        }
        if (action?.payload?.isFailure) {
            debug("failure request", link.url);
            continue;
        }
        if (!Array.isArray(action.payload?.data?.opds?.publications)) {
            debug("not an opds feed with publications array");
            continue;
        }

        const { payload: { data: { opds: { publications } } } } = action;

        const [publication] = publications || [];
        if (publication) {
            publication.authors = publication.authors
                ? Array.isArray(publication.authors)
                    ? publication.authors
                    : [publication.authors]
                : undefined;
        }

        if (
            !action.error
            && publication?.title
            && Array.isArray(publication?.authors)
        ) {

            debug("dispatch");
            yield put(
                dialogActions.updateRequest.build<DialogTypeName.PublicationInfoOpds>(
                    {
                        publication,
                    },
                ),
            );

            // could be 401 OPDS Authentication document,
            // tslint:disable-next-line: max-line-length
            // which we ignore in this case because should not occur with "entry" URLs (unlike "borrow", for example)
            debug("opds publication from publicationInfo received");

            // exit for loop
            break;
        }
    }
}

// Triggered when a publication-info-opds is asked
function* checkOpdsPublicationWatcher(action: dialogActions.openRequest.TAction) {

    debug("dialog open");

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

            yield race({
                a: call(updateOpdsInfoWithEntryLink, publication.entryLinks),
                b: take(dialogActions.closeRequest.ID),
            });
        }
    }
}

export function saga() {
    return takeSpawnLatest(
        dialogActions.openRequest.ID,
        checkOpdsPublicationWatcher,
        (e) => debug(e),
    );
}
