// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ToastType } from "readium-desktop/common/models/toast";
import { importActions, toastActions } from "readium-desktop/common/redux/actions";
import { selectTyped, takeTyped } from "readium-desktop/common/redux/typed-saga";
import { IOpdsLinkView } from "readium-desktop/common/views/opds";
import { diRendererGet } from "readium-desktop/renderer/di";
import { RootState } from "readium-desktop/renderer/redux/states";
import { all, call, put } from "redux-saga/effects";

import { Download } from "../states/download";
import { apiSaga } from "./api";

const REQUEST_ID = "SAME_FILE_IMPORT_REQUEST";

// FIXME : FInd the entire opdsLink and not url
// FIXME : a lot of Downoload interface (ex: state and model)
const findDownload = (dls: Download[], links: IOpdsLinkView[]) =>
    dls.find(
        (dl) => links.find(
            (ln) => ln.url === dl.url,
        ),
    );

function* sameFileImportWatcher() {
    while (true) {
        const action = yield* takeTyped(importActions.verify.build);

        const publication = action.payload.opdsPublicationView;

        const downloads = yield* selectTyped(
            (state: RootState) => state.download?.downloads);

        if (Array.isArray(downloads)
            && (findDownload(downloads, publication.openAccessLinks)
                || findDownload(downloads, publication.sampleOrPreviewLinks))) {

            // FIXME: set verifyImport with only a IOpdsLinkView
            // let the user the link of his choice
            yield* apiSaga("publication/importOpdsPublicationLink",
                REQUEST_ID,
                publication.entryLinks[0],
                publication.r2OpdsPublicationBase64,
            );

        } else {
            const translator = diRendererGet("translator");

            put(
                toastActions.openRequest.build(
                    ToastType.Success,
                    translator.translate("message.import.alreadyImport",
                        {
                            title: publication.title,
                        },
                    ),
                ),
            );
        }
    }
}

export function* watchers() {
    yield all([
        call(sameFileImportWatcher),
    ]);
}
