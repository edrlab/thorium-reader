// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { describe, expect, it, jest } from "@jest/globals";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import { apiActions, dialogActions, importActions } from "readium-desktop/common/redux/actions";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { IOpdsLinkView, IOpdsPublicationView } from "readium-desktop/common/views/opds";
import { PublicationView } from "readium-desktop/common/views/publication";
import { sameFileImport } from "readium-desktop/renderer/library/redux/sagas/sameFileImport";
import { stdChannel, runSaga } from "redux-saga";

jest.mock("readium-desktop/utils/uuid", () => ({
    uuidv4: () => "request-uuid",
}));

const link: IOpdsLinkView = {
    url: "https://example.com/publication.epub",
    type: "application/epub+zip",
};

const publication: IOpdsPublicationView = {
    baseUrl: "https://example.com/catalog",
    documentTitle: "A publication",
    authorsLangString: [],
    numberOfPages: 0,
    catalogLinkView: [],
    workIdentifier: "work-id",
    selfLink: {
        url: "https://example.com/publication.json",
    },
    openAccessLinks: [link],
};

const createState = (dialogOpen: boolean): ILibraryRootState =>
    ({
        download: [],
        dialog: {
            open: dialogOpen,
            type: DialogTypeName.PublicationInfoOpds,
            data: {
                publication,
            },
        },
    }) as unknown as ILibraryRootState;

const runImport = async (
    state: ILibraryRootState,
    result: PublicationView | undefined,
    includeUnrelatedResult = false,
) => {
    const channel = stdChannel();
    const dispatched: any[] = [];

    const task = runSaga(
        {
            channel,
            dispatch: (action: any) => {
                dispatched.push(action);
                if (action.type === apiActions.request.ID) {
                    void Promise.resolve().then(() => {
                        if (includeUnrelatedResult) {
                            channel.put(
                                apiActions.result.build(
                                    {
                                        ...action.meta.api,
                                        requestId: "unrelated-request",
                                    },
                                    result,
                                ),
                            );
                        }
                        channel.put(apiActions.result.build(action.meta.api, result));
                    });
                }
                return action;
            },
            getState: () => state,
        },
        sameFileImport,
        importActions.verify.build(link, publication),
    );

    await task.toPromise();
    return dispatched;
};

describe("sameFileImport", () => {
    it("keeps the matching OPDS dialog open and attaches the imported publication", async () => {
        const dispatched = await runImport(
            createState(true),
            { identifier: "local-publication-id" } as PublicationView,
            true,
        );

        const requestAction = dispatched.find((action) => action.type === apiActions.request.ID);
        expect(requestAction.meta.api.requestId).toBe("SAME_FILE_IMPORT_REQUEST_request-uuid");
        expect(dispatched.some((action) => action.type === dialogActions.closeRequest.ID)).toBe(false);

        const updateAction = dispatched.find((action) => action.type === dialogActions.updateRequest.ID);
        expect(updateAction.payload.data.publication.openAccessLinks[0].localBookshelfPublicationId).toBe(
            "local-publication-id",
        );
    });

    it("does not update a dialog that was closed while importing", async () => {
        const dispatched = await runImport(createState(false), {
            identifier: "local-publication-id",
        } as PublicationView);

        expect(dispatched.some((action) => action.type === dialogActions.updateRequest.ID)).toBe(false);
    });

    it("does not expose Read when the import has no publication result", async () => {
        const dispatched = await runImport(createState(true), undefined);

        expect(dispatched.some((action) => action.type === dialogActions.updateRequest.ID)).toBe(false);
    });
});
