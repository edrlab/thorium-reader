// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { diMainGet } from "readium-desktop/main/di";
import { winActions } from "../redux/actions";

export const flushSession = async () => {

    const store = diMainGet("store");

    const readers = store.getState().win.session.reader;
    for (const key in readers) {
        if (readers[key]) {

            const reader = readers[key];
            store.dispatch(winActions.session.unregisterReader.build(reader.identifier));
            store.dispatch(winActions.registry.registerReaderPublication.build(
                reader.publicationIdentifier,
                reader.windowBound,
                reader.reduxState,
            ));
        }
    }
};
