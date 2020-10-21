// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// import { IPublicationApi } from "readium-desktop/common/api/interface/publicationApi.interface";

import { IPublicationApi } from "readium-desktop/common/api/interface/publicationApi.interface";
import { readerActions } from "readium-desktop/common/redux/actions";
import { callTyped, takeTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { put, spawn } from "redux-saga/effects";

import { deletePublication } from "./delete";
import { exportPublication } from "./export";
import { findAll } from "./findAll";
import { findByTag } from "./findByTag";
import { getAllTags } from "./getAllTags";
import { getPublication } from "./getPublication";
import { importFromFs, importFromLink } from "./import";
import { search } from "./search";
import { updateTags } from "./updateTags";

function* importFromFsMayBeShiftPressed(
    filePath: string[] | string,
    shiftKeyPress = false,
): ReturnType<typeof importFromFs> {

    const pubView = yield* callTyped(importFromFs, filePath);

    if (shiftKeyPress && Array.isArray(pubView)) {

        for (const pub of pubView) {

            if (pub?.identifier) {

                yield spawn(function*() {

                    yield put(readerActions.openRequest.build(pub.identifier));

                    while (true) {

                        const action = yield* takeTyped(readerActions.closeSuccess.build);
                        const pubId = action?.payload?.publicationIdentifier;
                        if (pubId === pub.identifier) {

                            yield* callTyped(deletePublication, pubId);

                            break;
                        }
                    }
                });
            }
        }
    }

    return pubView;
}

export const publicationApi: IPublicationApi = {
    findAll,
    get: getPublication,
    delete: deletePublication,
    findByTag,
    updateTags,
    getAllTags,
    search,
    exportPublication,
    importFromFs: importFromFsMayBeShiftPressed,
    importFromLink,
};
