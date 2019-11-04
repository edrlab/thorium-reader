// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { lcpActions } from "readium-desktop/common/redux/actions";
import { open } from "readium-desktop/common/redux/actions/dialog";
import { diRendererGet } from "readium-desktop/renderer/di";
import { SagaIterator } from "redux-saga";
import { all, call, put, take } from "redux-saga/effects";

// import { PublicationView } from "readium-desktop/common/views/publication";
// import { ReaderState } from "readium-desktop/renderer/redux/states/reader";

export function* lcpUserKeyCheckRequestWatcher(): SagaIterator {
    while (true) {
        const action: any = yield take(lcpActions.ActionType.UserKeyCheckRequest);

        const { hint, publication, message } = action.payload;
        // const id1 = (publication as PublicationView).identifier;

        const store = diRendererGet("store");
        if (store.getState().reader.reader) {

            // const id2 = store.getState().reader.reader.publication.identifier;
            // const id3 = store.getState().reader.reader.identifier;

            // passphrase dialog only in library/bookshelf view
            // already-opened reader BrowserWindows (distinct renderer processes)
            // must not display the popup dialog!
            continue;
        }

        yield put(open("lcp-authentication",
            {
                publication,
                hint,
                message,
            },
        ));
    }
}

export function* watchers() {
    yield all([
        call(lcpUserKeyCheckRequestWatcher),
    ]);
}
