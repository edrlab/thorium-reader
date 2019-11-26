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

// FIXME : a lot of Downoload interface (ex: state and model)
const findDownload = (dls: Download[], link: IOpdsLinkView) =>
    dls.find(
        (dl) => dl.url === link.url,
    );

// FIXME :
// the import state is used only for this test
// try to remove import reducer and state and just dispatch a custorm action catch by redux-saga

function* sameFileImportWatcher() {
    while (true) {
        const action = yield* takeTyped(importActions.verify.build);

        const { link, title, r2OpdsPublicationBase64 } = action.payload;

        const downloads = yield* selectTyped(
            (state: RootState) => state.download?.downloads);

        if (Array.isArray(downloads)
            && findDownload(downloads, link)) {

            const translator = diRendererGet("translator");

            put(
                toastActions.openRequest.build(
                    ToastType.Success,
                    translator.translate("message.import.alreadyImport",
                        {
                            title: title || "",
                        },
                    ),
                ),
            );

        } else {

            yield* apiSaga("publication/importOpdsPublicationLink",
                REQUEST_ID,
                link,
                r2OpdsPublicationBase64,
            );
        }
    }
}

export function* watchers() {
    yield all([
        call(sameFileImportWatcher),
    ]);
}
