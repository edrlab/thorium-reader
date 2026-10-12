// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { describe, expect, it } from "@jest/globals";
import { ApiState, LAST_API_SUCCESS_ID } from "readium-desktop/common/redux/states/api";
import { THttpGetBrowserResultView } from "readium-desktop/common/views/browser";
import { IOpdsLinkView, IOpdsPublicationView } from "readium-desktop/common/views/opds";
import { BROWSE_OPDS_API_REQUEST_ID } from "readium-desktop/renderer/library/opds/constants";
import { opdsActions } from "readium-desktop/renderer/library/redux/actions";
import { libraryApiReducer } from "readium-desktop/renderer/library/redux/reducers/api";

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
    openAccessLinks: [link],
};

describe("libraryApiReducer", () => {
    it("keeps the imported publication attached in the cached OPDS payload", () => {
        const browserResult: THttpGetBrowserResultView = {
            url: "https://example.com/catalog",
            isFailure: false,
            isSuccess: true,
            data: {
                opds: {
                    title: "Catalog",
                    publications: [publication],
                },
            },
        };
        const state = {
            [LAST_API_SUCCESS_ID]: undefined,
            [BROWSE_OPDS_API_REQUEST_ID]: {
                data: {
                    time: 0,
                    error: false,
                    moduleId: "httpbrowser",
                    methodId: "browse",
                    result: browserResult,
                },
                lastSuccess: undefined,
                lastTime: 0,
            },
        } as ApiState<THttpGetBrowserResultView>;

        const updatedState = libraryApiReducer(
            state,
            opdsActions.publicationImported.build(link, "local-publication-id"),
        );

        expect(
            updatedState[BROWSE_OPDS_API_REQUEST_ID].data.result?.data?.opds?.publications?.[0].openAccessLinks?.[0]
                .localBookshelfPublicationId,
        ).toBe("local-publication-id");
        expect(state[BROWSE_OPDS_API_REQUEST_ID].data.result).toBe(browserResult);
    });
});
