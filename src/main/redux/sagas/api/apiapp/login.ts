// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { IApiappSearchResultView } from "readium-desktop/common/api/interface/apiappApi.interface";
import { call, take } from "typed-redux-saga/macro";
import { SagaGenerator } from "typed-redux-saga/dist";
import { authenticationRequestFromLibraryWebServiceURL, convertAuthenticationFromLibToR2OpdsAuth, dispatchAuthenticationProcess, getLoansUrlsFromLibrary } from "../../apiapp";
import isURL from "validator/lib/isURL";
import { importFromLink } from "../publication/import";
import { IOpdsLinkView } from "readium-desktop/common/views/opds";
import { authActions } from "readium-desktop/common/redux/actions";

const debug = debug_("readium-desktop:main/redux/sagas/api/apiapp/login");

export function* login(libView: IApiappSearchResultView): SagaGenerator<void> {

    const res = yield* call(authenticationRequestFromLibraryWebServiceURL, libView.url);

    const doc = yield* call(convertAuthenticationFromLibToR2OpdsAuth, res, libView);

    debug(JSON.stringify(doc, null, 4));

    yield* call(dispatchAuthenticationProcess, doc, libView.url);


    // wait the end of authentication process result
    yield* take(authActions.done.build);

    const endpoint = res.resources[0].endpoint;
    if (!isURL(endpoint)) {
        debug("no endpoint url", endpoint);
        return ;
    }
    debug("loans endpoint");
    const loansUrlArray = yield* call(getLoansUrlsFromLibrary, endpoint);

    debug("loans URL", loansUrlArray);

    const opdsLinkView: IOpdsLinkView[] = loansUrlArray.map((url) => ({url}));

    for (const linkView of opdsLinkView) {
        yield* call(importFromLink, linkView);
    }
}
