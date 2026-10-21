// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import { DialogType, DialogTypeName } from "readium-desktop/common/models/dialog";
import { ToastType } from "readium-desktop/common/models/toast";
import { apiActions, dialogActions, importActions, toastActions } from "readium-desktop/common/redux/actions";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { apiSaga } from "readium-desktop/renderer/common/redux/sagas/api";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { all, put, select, take } from "redux-saga/effects";
import { getTranslator } from "readium-desktop/common/services/translator";
import { PublicationView } from "readium-desktop/common/views/publication";
import { IOpdsPublicationView } from "readium-desktop/common/views/opds";
import { uuidv4 } from "readium-desktop/utils/uuid";

import { attachLocalBookshelfPublication } from "readium-desktop/renderer/library/opds/localBookshelfPublication";
import { opdsActions } from "readium-desktop/renderer/library/redux/actions";

const REQUEST_ID = "SAME_FILE_IMPORT_REQUEST";

// Logger
const filename_ = "readium-desktop:renderer:redux:saga:same-file-import";
const debug = debug_(filename_);

export function* sameFileImport(action: importActions.verify.TAction) {

    const { link, pub, rootFeedIdentifier } = action.payload;

    const downloads: ILibraryRootState["download"] = yield select(
        (state: ILibraryRootState) => state.download);

    if (Array.isArray(downloads)
        && downloads.map((tuple) => {
            // tuple[0] ==== Payload
            // tuple[1] ==== number
            return tuple[0].downloadUrls;
        }).find((urls) => urls.find((u) => u === link.url))
    ) {
        yield put(
            toastActions.openRequest.build(
                ToastType.Success,
                getTranslator().__("message.import.alreadyImport",
                    {
                        title: pub.documentTitle || "",
                    },
                ),
            ),
        );

    } else {

        const requestId = `${REQUEST_ID}_${uuidv4()}`;

        yield apiSaga("publication/importFromLink",
            requestId,
            link,
            false, // willBeImmediatelyFollowedByOpen
            pub,
            rootFeedIdentifier,
        );

        let resultAction: apiActions.result.TAction<PublicationView | undefined>;
        while (true) {
            resultAction = yield take(apiActions.result.ID);
            if (resultAction.meta.api.requestId === requestId) {
                break;
            }
        }

        yield put(apiActions.clean.build(requestId));

        const publicationIdentifier = resultAction.error
            ? undefined
            : resultAction.payload?.identifier;
        if (!publicationIdentifier) {
            return;
        }

        yield put(opdsActions.publicationImported.build(link, publicationIdentifier));

        const dialog: ILibraryRootState["dialog"] = yield select(
            (state: ILibraryRootState) => state.dialog,
        );
        if (!dialog.open || dialog.type !== DialogTypeName.PublicationInfoOpds) {
            return;
        }

        const dialogData = dialog.data as DialogType[DialogTypeName.PublicationInfoOpds];
        const currentPublication = dialogData?.publication as IOpdsPublicationView | undefined;
        if (!currentPublication) {
            return;
        }

        const updatedPublication = attachLocalBookshelfPublication(
            currentPublication,
            link,
            publicationIdentifier,
        );
        if (updatedPublication === currentPublication) {
            return;
        }

        yield put(dialogActions.updateRequest.build<DialogTypeName.PublicationInfoOpds>({
            publication: updatedPublication,
        }));
    }
}

export function saga() {
    return all([
        takeSpawnEvery(
            importActions.verify.ID,
            sameFileImport,
            (e) => debug(e),
        ),
    ]);
}
