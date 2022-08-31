// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import * as debug_ from "debug";
import { readerActions } from "readium-desktop/common/redux/actions";
import { winActions } from "readium-desktop/main/redux/actions";
import { RootState } from "readium-desktop/main/redux/states";
import { IWinSessionReaderState } from "readium-desktop/main/redux/states/win/session/reader";
import { ObjectValues } from "readium-desktop/utils/object-keys-values";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { fork, put } from "redux-saga/effects";
import { call as callTyped, select as selectTyped } from "typed-redux-saga/macro";

import { streamerOpenPublicationAndReturnManifestUrl } from "../../publication/openPublication";

// Logger
const debug = debug_("readium-desktop:main:saga:checkReaderWindowSession");

function* openReaderFromPreviousSession(reader: IWinSessionReaderState, nbOfReaderInSession: number) {

    const publicationIdentifier = reader.publicationIdentifier;
    let manifestUrl: string;
    try {
        manifestUrl = yield* callTyped(streamerOpenPublicationAndReturnManifestUrl, publicationIdentifier);
    } catch (err) {
        debug("ERROR to open a publication from previous session:", reader.identifier, err);

        yield put(winActions.session.unregisterReader.build(reader.identifier));
        yield put(winActions.registry.registerReaderPublication.build(
            reader.publicationIdentifier,
            reader.windowBound,
            reader.reduxState),
        );
    }

    if (manifestUrl) {

        let bound = reader.windowBound;

        if (nbOfReaderInSession > 1) {
            yield put(readerActions.detachModeRequest.build());
        } else {
            bound = yield* selectTyped((state: RootState) => state.win.session.library.windowBound);
        }

        yield put(winActions.reader.openRequest.build(
            publicationIdentifier,
            manifestUrl,
            bound,
            reader.reduxState,
            reader.identifier,
        ));
    }
}

/**
 * On library open request action, dispatch the opening of all readers in session
 */
export function* checkReaderWindowInSession(_action: winActions.library.openRequest.TAction) {

    // should be readers identifier from session and not open a new reader with this publicationIdentifier
    // ex: if 2 readers with the same pubId was previously opened,
    // at the next starting they need to deshydrate data from session and not from pubId registry

    const readers = yield* selectTyped(
        (state: RootState) => state.win.session.reader,
    );
    const readersArray = ObjectValues(readers);

    debug("checkReaderWindowInSession:", "nb of readers in session:", readersArray.length);

    if (readersArray.length > 10) {
        for (const reader of readersArray) {
            yield put(winActions.session.unregisterReader.build(reader.identifier));
            yield put(winActions.registry.registerReaderPublication.build(
                reader.publicationIdentifier,
                reader.windowBound,
                reader.reduxState),
            );
        }
    } else {

        for (const reader of readersArray) {
            yield fork(openReaderFromPreviousSession, reader, readersArray.length);
        }
    }

    // TODO
    // Display an infoBox too many reader opened previously

}
